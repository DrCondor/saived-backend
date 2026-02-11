require "test_helper"

class Api::V1::ProjectItemsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = create(:project_section, project: @project)
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    post api_v1_project_section_items_path(@section),
         params: { product_item: { name: "Test" } }
    assert_response :unauthorized
  end

  test "authenticates with Bearer token" do
    post api_v1_project_section_items_path(@section),
         params: { product_item: { name: "Test" } },
         headers: auth_headers(@user)
    assert_response :created
  end

  # ============================================================
  # CREATE
  # ============================================================

  test "create creates new item" do
    assert_difference "ProjectItem.count", 1 do
      post api_v1_project_section_items_path(@section),
           params: {
             product_item: {
               name: "Test Product",
               quantity: 2,
               unit_price: 299.99,
               currency: "PLN",
               status: "Propozycja"
             }
           },
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "Test Product", json_response["name"]
    assert_equal 2, json_response["quantity"]
    assert_equal 299.99, json_response["unit_price"]
  end

  test "create with full extension payload" do
    assert_difference [ "ProjectItem.count", "ProductCaptureSample.count" ], 1 do
      post api_v1_project_section_items_path(@section),
           params: {
             product_item: {
               name: "Krzeslo Biurowe",
               quantity: 1,
               unit_price: 329.99,
               currency: "PLN",
               status: "Propozycja",
               external_url: "https://ikea.pl/p/12345",
               thumbnail_url: "https://ikea.pl/img/12345.jpg"
             },
             capture_context: {
               url: "https://ikea.pl/p/12345",
               domain: "ikea.pl",
               selectors: {
                 name: "h1.product-title",
                 price: ".price-box"
               },
               engine: "heuristic-v1"
             },
             original_product: {
               name: "Krzeslo Biurowe",
               price: "329,99 zł"
             }
           },
           headers: auth_headers(@user)
    end

    assert_response :created

    sample = ProductCaptureSample.last
    assert_equal @user.id, sample.user_id
    assert_equal "ikea.pl", sample.domain
    assert_equal "Krzeslo Biurowe", sample.raw_payload["name"]
  end

  test "create returns 422 with invalid params" do
    post api_v1_project_section_items_path(@section),
         params: { product_item: { name: "" } },
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert json_response["errors"].any? { |e| e.include?("Name") }
  end

  test "create returns 404 for non-existent section" do
    post api_v1_project_section_items_path(project_section_id: 999999),
         params: { product_item: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "create returns 404 for section in other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)
    other_section = create(:project_section, project: other_project)

    post api_v1_project_section_items_path(other_section),
         params: { product_item: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "create sets default status to bez_statusu" do
    post api_v1_project_section_items_path(@section),
         params: { product_item: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :created
    item = ProjectItem.last
    assert_equal "bez_statusu", item.status
  end

  # ============================================================
  # UPDATE
  # ============================================================

  test "update updates item" do
    item = create(:project_item, project_section: @section, name: "Old Name")

    patch api_v1_project_section_item_path(@section, item),
          params: { product_item: { name: "New Name", unit_price: 199.99 } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "New Name", json_response["name"]
    assert_equal 199.99, json_response["unit_price"]
    assert_equal "New Name", item.reload.name
  end

  test "update returns 404 for non-existent item" do
    patch api_v1_project_section_item_path(@section, id: 999999),
          params: { product_item: { name: "Test" } },
          headers: auth_headers(@user)

    assert_response :not_found
  end

  test "update returns 422 with invalid params" do
    item = create(:project_item, project_section: @section)

    patch api_v1_project_section_item_path(@section, item),
          params: { product_item: { name: "" } },
          headers: auth_headers(@user)

    assert_response :unprocessable_entity
  end

  # ============================================================
  # DESTROY
  # ============================================================

  test "destroy soft-deletes item" do
    item = create(:project_item, project_section: @section)

    assert_no_difference "ProjectItem.unscoped.count" do
      delete api_v1_project_section_item_path(@section, item),
             headers: auth_headers(@user)
    end

    assert_response :no_content
    assert_not_nil item.reload.deleted_at
  end

  test "destroy returns 404 for non-existent item" do
    delete api_v1_project_section_item_path(@section, id: 999999),
           headers: auth_headers(@user)

    assert_response :not_found
  end

  # ============================================================
  # PRICE HANDLING
  # ============================================================

  test "accepts price with comma (Polish format)" do
    post api_v1_project_section_items_path(@section),
         params: {
           product_item: {
             name: "Test",
             unit_price: "329,99"
           }
         },
         headers: auth_headers(@user)

    assert_response :created
    item = ProjectItem.last
    assert_equal 32999, item.unit_price_cents
  end

  test "accepts price with dot" do
    post api_v1_project_section_items_path(@section),
         params: {
           product_item: {
             name: "Test",
             unit_price: "329.99"
           }
         },
         headers: auth_headers(@user)

    assert_response :created
    item = ProjectItem.last
    assert_equal 32999, item.unit_price_cents
  end

  test "returns total_price in response" do
    post api_v1_project_section_items_path(@section),
         params: {
           product_item: {
             name: "Test",
             unit_price: 100.00,
             quantity: 3
           }
         },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal 300.0, json_response["total_price"]
  end
end
