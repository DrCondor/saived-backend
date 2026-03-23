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

  # ============================================================
  # DUPLICATE
  # ============================================================

  test "duplicate creates exact copy of a product" do
    item = create(:project_item, project_section: @section,
      name: "Krzesło IKEA", note: "Czarne", quantity: 2,
      unit_price_cents: 29999, currency: "PLN", category: "Meble",
      dimensions: "80x45x90", status: "kupione", item_type: "product",
      external_url: "https://ikea.pl/p/123", thumbnail_url: "https://ikea.pl/img/123.jpg",
      discount_percent: 10, discount_code: "PROMO10", discount_label: "-10% (PROMO10)",
      original_unit_price_cents: 33332, position: 0)

    assert_difference "ProjectItem.count", 1 do
      post duplicate_api_v1_project_section_item_path(@section, item),
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "Krzesło IKEA", json_response["name"]
    assert_equal "Czarne", json_response["note"]
    assert_equal 2, json_response["quantity"]
    assert_equal 299.99, json_response["unit_price"]
    assert_equal "PLN", json_response["currency"]
    assert_equal "Meble", json_response["category"]
    assert_equal "80x45x90", json_response["dimensions"]
    assert_equal "kupione", json_response["status"]
    assert_equal "product", json_response["item_type"]
    assert_equal "https://ikea.pl/p/123", json_response["external_url"]
    assert_equal "https://ikea.pl/img/123.jpg", json_response["thumbnail_url"]
    assert_equal 10, json_response["discount_percent"]
    assert_equal "PROMO10", json_response["discount_code"]
    assert_equal "-10% (PROMO10)", json_response["discount_label"]
    assert_equal 333.32, json_response["original_unit_price"]
    assert_not_equal item.id, json_response["id"]
  end

  test "duplicate creates exact copy of a contractor" do
    item = create(:project_item, project_section: @section,
      name: "Malarz Jan", item_type: "contractor",
      unit_price_cents: 500000, status: "kupione",
      phone: "123456789", address: "ul. Testowa 1, Warszawa",
      position: 0)

    assert_difference "ProjectItem.count", 1 do
      post duplicate_api_v1_project_section_item_path(@section, item),
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "Malarz Jan", json_response["name"]
    assert_equal "contractor", json_response["item_type"]
    assert_equal 5000.0, json_response["unit_price"]
    assert_equal "123456789", json_response["phone"]
    assert_equal "ul. Testowa 1, Warszawa", json_response["address"]
  end

  test "duplicate creates exact copy of a note" do
    item = create(:project_item, project_section: @section,
      name: "Uwaga", note: "Trzy opcje płytek", item_type: "note",
      status: "bez_statusu", unit_price_cents: nil, position: 0)

    assert_difference "ProjectItem.count", 1 do
      post duplicate_api_v1_project_section_item_path(@section, item),
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "Uwaga", json_response["name"]
    assert_equal "Trzy opcje płytek", json_response["note"]
    assert_equal "note", json_response["item_type"]
  end

  test "duplicate inserts at correct position and shifts others" do
    item1 = create(:project_item, project_section: @section, name: "First", position: 0)
    item2 = create(:project_item, project_section: @section, name: "Second", position: 1)
    item3 = create(:project_item, project_section: @section, name: "Third", position: 2)

    post duplicate_api_v1_project_section_item_path(@section, item1),
         headers: auth_headers(@user)

    assert_response :created
    new_item = ProjectItem.find(json_response["id"])

    assert_equal 1, new_item.position
    assert_equal 0, item1.reload.position
    assert_equal 2, item2.reload.position
    assert_equal 3, item3.reload.position
  end

  test "duplicate copies attachment as independent blob" do
    item = create(:project_item, project_section: @section,
      name: "With attachment", item_type: "contractor", position: 0)
    item.attachment.attach(
      io: StringIO.new("test file content"),
      filename: "contract.pdf",
      content_type: "application/pdf"
    )

    assert_difference "ActiveStorage::Blob.count", 1 do
      post duplicate_api_v1_project_section_item_path(@section, item),
           headers: auth_headers(@user)
    end

    assert_response :created
    new_item = ProjectItem.find(json_response["id"])
    assert new_item.attachment.attached?
    assert_equal "contract.pdf", new_item.attachment.filename.to_s
    assert_equal "test file content", new_item.attachment.download
    # Independent blob — different from original
    assert_not_equal item.attachment.blob_id, new_item.attachment.blob_id
  end

  test "duplicate does not copy capture samples or favorites" do
    item = create(:project_item, project_section: @section, position: 0)
    create(:product_capture_sample, project_item: item, user: @user,
      url: "https://test.com", domain: "test.com")
    @user.item_favorites.create!(project_item: item)

    post duplicate_api_v1_project_section_item_path(@section, item),
         headers: auth_headers(@user)

    assert_response :created
    new_item = ProjectItem.find(json_response["id"])
    assert_equal 0, new_item.product_capture_samples.count
    assert_equal false, json_response["favorite"]
  end

  test "duplicate returns 401 without auth" do
    item = create(:project_item, project_section: @section, position: 0)

    post duplicate_api_v1_project_section_item_path(@section, item)
    assert_response :unauthorized
  end

  test "duplicate returns 404 for item in other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)
    other_section = create(:project_section, project: other_project)
    other_item = create(:project_item, project_section: other_section, position: 0)

    post duplicate_api_v1_project_section_item_path(other_section, other_item),
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "duplicate returns 404 for non-existent item" do
    post duplicate_api_v1_project_section_item_path(@section, id: 999999),
         headers: auth_headers(@user)

    assert_response :not_found
  end
end
