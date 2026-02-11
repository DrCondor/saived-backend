require "test_helper"

class Api::V1::SectionGroupsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @group = create(:section_group, project: @project)
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    post api_v1_project_section_groups_path(@project),
         params: { section_group: { name: "Test" } }
    assert_response :unauthorized
  end

  # ============================================================
  # CREATE
  # ============================================================

  test "create creates new group" do
    assert_difference "SectionGroup.count", 1 do
      post api_v1_project_section_groups_path(@project),
           params: { section_group: { name: "Parter" } },
           headers: auth_headers(@user)
    end

    assert_response :created
    assert_equal "Parter", json_response["name"]
  end

  test "create uses default name when empty" do
    post api_v1_project_section_groups_path(@project),
         params: { section_group: { name: "" } },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal "Nowa grupa", json_response["name"]
  end

  test "create sets position automatically" do
    create(:section_group, project: @project, position: 5)

    post api_v1_project_section_groups_path(@project),
         params: { section_group: { name: "New" } },
         headers: auth_headers(@user)

    assert_response :created
    assert_equal 6, json_response["position"]
  end

  test "create returns 404 for other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)

    post api_v1_project_section_groups_path(other_project),
         params: { section_group: { name: "Test" } },
         headers: auth_headers(@user)

    assert_response :not_found
  end

  # ============================================================
  # UPDATE
  # ============================================================

  test "update updates group name" do
    patch api_v1_project_section_group_path(@project, @group),
          params: { section_group: { name: "Piętro" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Piętro", json_response["name"]
    assert_equal "Piętro", @group.reload.name
  end

  test "update returns 404 for non-existent group" do
    patch api_v1_project_section_group_path(@project, id: 999999),
          params: { section_group: { name: "Test" } },
          headers: auth_headers(@user)

    assert_response :not_found
  end

  # ============================================================
  # DESTROY
  # ============================================================

  test "destroy soft-deletes group" do
    assert_no_difference "SectionGroup.unscoped.count" do
      delete api_v1_project_section_group_path(@project, @group),
             headers: auth_headers(@user)
    end

    assert_response :no_content
    assert_not_nil @group.reload.deleted_at
  end

  test "destroy cascades soft-delete to sections and items" do
    section = create(:project_section, project: @project, section_group: @group)
    item = create(:project_item, project_section: section)

    delete api_v1_project_section_group_path(@project, @group),
           headers: auth_headers(@user)

    assert_response :no_content
    assert_not_nil @group.reload.deleted_at
    assert_not_nil section.reload.deleted_at
    assert_not_nil item.reload.deleted_at
  end

  test "destroy returns 404 for non-existent group" do
    delete api_v1_project_section_group_path(@project, id: 999999),
           headers: auth_headers(@user)

    assert_response :not_found
  end
end
