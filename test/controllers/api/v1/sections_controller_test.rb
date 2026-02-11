require "test_helper"

class Api::V1::SectionsControllerTest < ActionDispatch::IntegrationTest
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
    post api_v1_project_sections_path(@project),
         params: { section: { name: "Test" } }
    assert_response :unauthorized
  end

  # ============================================================
  # CREATE
  # ============================================================

  test "create creates new section" do
    assert_difference "ProjectSection.count", 1 do
      post api_v1_project_sections_path(@project),
           params: { section: { name: "New Section" } },
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "New Section", json_response["name"]
  end

  test "create uses default name when empty" do
    post api_v1_project_sections_path(@project),
         params: { section: { name: "" } },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal "Nowa sekcja", json_response["name"]
  end

  test "create sets position automatically" do
    existing_section = create(:project_section, project: @project, position: 5)
    max_position = @project.sections.maximum(:position)

    post api_v1_project_sections_path(@project),
         params: { section: { name: "New" } },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal max_position + 1, json_response["position"]
  end

  test "create returns 404 for non-existent project" do
    post api_v1_project_sections_path(project_id: 999999),
         params: { section: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "create returns 404 for other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)

    post api_v1_project_sections_path(other_project),
         params: { section: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "create returns section with items array" do
    post api_v1_project_sections_path(@project),
         params: { section: { name: "New Section" } },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal [], json_response["items"]
  end

  # ============================================================
  # UPDATE
  # ============================================================

  test "update updates section name" do
    patch api_v1_project_section_path(@project, @section),
          params: { section: { name: "Updated Name" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Updated Name", json_response["name"]
    assert_equal "Updated Name", @section.reload.name
  end

  test "update updates section position" do
    patch api_v1_project_section_path(@project, @section),
          params: { section: { position: 10 } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal 10, json_response["position"]
  end

  test "update returns 404 for non-existent section" do
    patch api_v1_project_section_path(@project, id: 999999),
          params: { section: { name: "Test" } },
          headers: auth_headers(@user)

    assert_response :not_found
  end

  test "update returns section with items" do
    item = create(:project_item, project_section: @section, name: "Test Item")

    patch api_v1_project_section_path(@project, @section),
          params: { section: { name: "Updated" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal 1, json_response["items"].length
    assert_equal item.id, json_response["items"][0]["id"]
  end

  # ============================================================
  # DESTROY
  # ============================================================

  test "destroy soft-deletes section" do
    assert_no_difference "ProjectSection.unscoped.count" do
      delete api_v1_project_section_path(@project, @section),
             headers: auth_headers(@user)
    end

    assert_response :no_content
    assert_not_nil @section.reload.deleted_at
  end

  test "destroy returns 404 for non-existent section" do
    delete api_v1_project_section_path(@project, id: 999999),
           headers: auth_headers(@user)

    assert_response :not_found
  end

  test "destroy cascades soft-delete to items" do
    item = create(:project_item, project_section: @section)

    delete api_v1_project_section_path(@project, @section),
           headers: auth_headers(@user)

    assert_response :no_content
    assert_not_nil item.reload.deleted_at
  end

  # ============================================================
  # RESPONSE FORMAT
  # ============================================================

  test "response includes total_price" do
    create(:project_item, project_section: @section, unit_price_cents: 10000, quantity: 2)

    patch api_v1_project_section_path(@project, @section),
          params: { section: { name: "Test" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal 200.0, json_response["total_price"]
  end

  test "items in response include all fields" do
    create(:project_item, project_section: @section,
           name: "Chair", note: "Nice chair", quantity: 2,
           unit_price_cents: 29999, currency: "PLN",
           category: "Meble", status: "Propozycja",
           external_url: "https://example.com/chair",
           thumbnail_url: "https://example.com/chair.jpg")

    patch api_v1_project_section_path(@project, @section),
          params: { section: { name: "Test" } },
          headers: auth_headers(@user)

    item = json_response["items"][0]
    assert_equal "Chair", item["name"]
    assert_equal "Nice chair", item["note"]
    assert_equal 2, item["quantity"]
    assert_equal 299.99, item["unit_price"]
    assert_equal 599.98, item["total_price"]
    assert_equal "PLN", item["currency"]
    assert_equal "Meble", item["category"]
    assert_equal "Propozycja", item["status"]
  end
end
