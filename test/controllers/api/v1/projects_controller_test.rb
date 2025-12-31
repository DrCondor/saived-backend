require "test_helper"

class Api::V1::ProjectsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    get api_v1_projects_path
    assert_response :unauthorized
    assert_equal "Unauthorized", json_response["error"]
  end

  test "authenticates with Bearer token" do
    get api_v1_projects_path, headers: auth_headers(@user)
    assert_response :success
  end

  # ============================================================
  # INDEX
  # ============================================================

  test "index returns user projects" do
    section = create(:project_section, project: @project)

    get api_v1_projects_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal 1, json_response["projects"].length
    assert_equal @project.id, json_response["projects"][0]["id"]
    assert_equal @project.name, json_response["projects"][0]["name"]
    assert_equal 1, json_response["projects"][0]["sections"].length
  end

  test "index does not return other users projects" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)

    get api_v1_projects_path, headers: auth_headers(@user)

    assert_response :success
    project_ids = json_response["projects"].map { |p| p["id"] }
    assert_not_includes project_ids, other_project.id
  end

  test "index includes total_price" do
    section = create(:project_section, project: @project)
    create(:project_item, project_section: section, unit_price_cents: 10000, quantity: 2)

    get api_v1_projects_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal 200.0, json_response["projects"][0]["total_price"]
  end

  # ============================================================
  # SHOW
  # ============================================================

  test "show returns project with sections and items" do
    section = create(:project_section, project: @project)
    item = create(:project_item, project_section: section, name: "Test Item")

    get api_v1_project_path(@project), headers: auth_headers(@user)

    assert_response :success
    assert_equal @project.id, json_response["id"]
    assert_equal @project.name, json_response["name"]
    assert_equal 1, json_response["sections"].length
    assert_equal section.id, json_response["sections"][0]["id"]
    assert_equal 1, json_response["sections"][0]["items"].length
    assert_equal item.id, json_response["sections"][0]["items"][0]["id"]
    assert_equal "Test Item", json_response["sections"][0]["items"][0]["name"]
  end

  test "show returns 404 for non-existent project" do
    get api_v1_project_path(id: 999999), headers: auth_headers(@user)
    assert_response :not_found
  end

  test "show returns 404 for other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)

    get api_v1_project_path(other_project), headers: auth_headers(@user)
    assert_response :not_found
  end

  # ============================================================
  # CREATE
  # ============================================================

  test "create creates new project" do
    assert_difference "Project.count", 1 do
      post api_v1_projects_path,
           params: { project: { name: "New Project", description: "Test" } },
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "New Project", json_response["name"]
    assert_equal "Test", json_response["description"]
  end

  test "create sets current user as owner" do
    post api_v1_projects_path,
         params: { project: { name: "New Project" } },
         headers: auth_headers(@user)

    project = Project.last
    assert_equal @user.id, project.owner_id
  end

  test "create creates membership for owner" do
    assert_difference "ProjectMembership.count", 1 do
      post api_v1_projects_path,
           params: { project: { name: "New Project" } },
           headers: auth_headers(@user)
    end

    project = Project.last
    membership = project.project_memberships.find_by(user: @user)
    assert_equal "owner", membership.role
  end

  test "create returns 422 with invalid params" do
    post api_v1_projects_path,
         params: { project: { name: "" } },
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert json_response["errors"].any? { |e| e.include?("Name") }
  end

  # ============================================================
  # UPDATE
  # ============================================================

  test "update updates project" do
    patch api_v1_project_path(@project),
          params: { project: { name: "Updated Name" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Updated Name", json_response["name"]
    assert_equal "Updated Name", @project.reload.name
  end

  test "update returns 404 for non-existent project" do
    patch api_v1_project_path(id: 999999),
          params: { project: { name: "Test" } },
          headers: auth_headers(@user)

    assert_response :not_found
  end

  test "update returns 422 with invalid params" do
    patch api_v1_project_path(@project),
          params: { project: { name: "" } },
          headers: auth_headers(@user)

    assert_response :unprocessable_entity
  end

  # ============================================================
  # DESTROY
  # ============================================================

  test "destroy deletes project" do
    assert_difference "Project.count", -1 do
      delete api_v1_project_path(@project), headers: auth_headers(@user)
    end

    assert_response :no_content
  end

  test "destroy returns 404 for non-existent project" do
    delete api_v1_project_path(id: 999999), headers: auth_headers(@user)
    assert_response :not_found
  end

  test "destroy cascades to sections and items" do
    section = create(:project_section, project: @project)
    item = create(:project_item, project_section: section)

    delete api_v1_project_path(@project), headers: auth_headers(@user)

    assert_nil ProjectSection.find_by(id: section.id)
    assert_nil ProjectItem.find_by(id: item.id)
  end

  # ============================================================
  # TOGGLE FAVORITE
  # ============================================================

  test "toggle_favorite toggles favorite status" do
    assert_not @project.favorite

    post toggle_favorite_api_v1_project_path(@project), headers: auth_headers(@user)

    assert_response :success
    assert json_response["favorite"]
    assert @project.reload.favorite

    post toggle_favorite_api_v1_project_path(@project), headers: auth_headers(@user)

    assert_response :success
    assert_not json_response["favorite"]
    assert_not @project.reload.favorite
  end

  # ============================================================
  # REORDER ALL
  # ============================================================

  test "reorder_all reorders projects" do
    project2 = create(:project, owner: @user)
    project2.project_memberships.create!(user: @user, role: "owner")
    project3 = create(:project, owner: @user)
    project3.project_memberships.create!(user: @user, role: "owner")

    post api_v1_projects_reorder_path,
         params: { project_order: [ project3.id, @project.id, project2.id ] },
         headers: auth_headers(@user)

    assert_response :success
    assert_equal 0, project3.reload.position
    assert_equal 1, @project.reload.position
    assert_equal 2, project2.reload.position
  end

  # ============================================================
  # REORDER (items and sections)
  # ============================================================

  test "reorder reorders sections" do
    section1 = create(:project_section, project: @project, position: 0)
    section2 = create(:project_section, project: @project, position: 1)
    section3 = create(:project_section, project: @project, position: 2)

    post reorder_api_v1_project_path(@project),
         params: { section_order: [ section3.id, section1.id, section2.id ] },
         headers: auth_headers(@user)

    assert_response :success
    assert_equal 0, section3.reload.position
    assert_equal 1, section1.reload.position
    assert_equal 2, section2.reload.position
  end

  test "reorder moves items between sections" do
    section1 = create(:project_section, project: @project)
    section2 = create(:project_section, project: @project)
    item = create(:project_item, project_section: section1, position: 0)

    post reorder_api_v1_project_path(@project),
         params: {
           item_moves: [
             { item_id: item.id, section_id: section2.id, position: 0 }
           ]
         },
         headers: auth_headers(@user)

    assert_response :success
    assert_equal section2.id, item.reload.project_section_id
  end
end
