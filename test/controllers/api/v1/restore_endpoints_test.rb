require "test_helper"

class Api::V1::RestoreEndpointsTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = create(:project_section, project: @project)
    @item = create(:project_item, project_section: @section, name: "Test Item")
  end

  # ============================================================
  # ITEM RESTORE
  # ============================================================

  test "restore item: success" do
    @item.soft_delete!

    post restore_api_v1_project_section_item_path(@section, @item),
         headers: auth_headers(@user)

    assert_response :success
    assert_nil @item.reload.deleted_at
    assert_equal "Test Item", json_response["name"]
  end

  test "restore item: unauthorized" do
    @item.soft_delete!

    post restore_api_v1_project_section_item_path(@section, @item)

    assert_response :unauthorized
  end

  test "restore item: not found" do
    post restore_api_v1_project_section_item_path(@section, id: 999999),
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "restore item: not deleted (422)" do
    post restore_api_v1_project_section_item_path(@section, @item),
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_match "not deleted", json_response["error"]
  end

  test "restore item: parent section still deleted (422)" do
    @section.soft_delete!

    post restore_api_v1_project_section_item_path(@section, @item),
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_match "soft-deleted", json_response["error"]
  end

  # ============================================================
  # SECTION RESTORE
  # ============================================================

  test "restore section: success with cascaded items" do
    item2 = create(:project_item, project_section: @section, name: "Item 2")
    @section.soft_delete!

    post restore_api_v1_project_section_path(@project, @section),
         headers: auth_headers(@user)

    assert_response :success
    assert_nil @section.reload.deleted_at
    assert_nil @item.reload.deleted_at
    assert_nil item2.reload.deleted_at
    assert_equal @section.id, json_response["id"]
  end

  test "restore section: individually deleted items stay deleted" do
    @item.soft_delete!
    @section.soft_delete!

    post restore_api_v1_project_section_path(@project, @section),
         headers: auth_headers(@user)

    assert_response :success
    assert_nil @section.reload.deleted_at
    assert_not_nil @item.reload.deleted_at  # individually deleted
  end

  test "restore section: unauthorized" do
    @section.soft_delete!

    post restore_api_v1_project_section_path(@project, @section)

    assert_response :unauthorized
  end

  test "restore section: not found" do
    post restore_api_v1_project_section_path(@project, id: 999999),
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "restore section: not deleted (422)" do
    post restore_api_v1_project_section_path(@project, @section),
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_match "not deleted", json_response["error"]
  end

  test "restore section: parent group still deleted (422)" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)
    group.soft_delete!

    post restore_api_v1_project_section_path(@project, @section),
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_match "soft-deleted", json_response["error"]
  end

  # ============================================================
  # SECTION GROUP RESTORE
  # ============================================================

  test "restore group: success with cascaded sections and items" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)
    group.soft_delete!

    post restore_api_v1_project_section_group_path(@project, group),
         headers: auth_headers(@user)

    assert_response :success
    assert_nil group.reload.deleted_at
    assert_nil @section.reload.deleted_at
    assert_nil @item.reload.deleted_at
  end

  test "restore group: unauthorized" do
    group = create(:section_group, project: @project)
    group.soft_delete!

    post restore_api_v1_project_section_group_path(@project, group)

    assert_response :unauthorized
  end

  test "restore group: not found" do
    post restore_api_v1_project_section_group_path(@project, id: 999999),
         headers: auth_headers(@user)

    assert_response :not_found
  end

  test "restore group: not deleted (422)" do
    group = create(:section_group, project: @project)

    post restore_api_v1_project_section_group_path(@project, group),
         headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_match "not deleted", json_response["error"]
  end

  test "restore group: individually deleted children stay deleted" do
    group = create(:section_group, project: @project)
    section2 = create(:project_section, project: @project, section_group: group)
    @section.update!(section_group: group)

    # Delete section2 individually before group delete
    section2.soft_delete!

    # Delete group
    group.soft_delete!

    # Restore group
    post restore_api_v1_project_section_group_path(@project, group),
         headers: auth_headers(@user)

    assert_response :success
    assert_nil group.reload.deleted_at
    assert_nil @section.reload.deleted_at
    assert_not_nil section2.reload.deleted_at  # individually deleted
  end
end
