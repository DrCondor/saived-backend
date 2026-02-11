require "test_helper"

class SoftDeleteTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = create(:project_section, project: @project)
    @item1 = create(:project_item, project_section: @section, name: "Item 1")
    @item2 = create(:project_item, project_section: @section, name: "Item 2")
  end

  # ============================================================
  # ITEM SOFT DELETE
  # ============================================================

  test "item soft_delete! sets deleted_at" do
    @item1.soft_delete!
    assert_not_nil @item1.reload.deleted_at
  end

  test "soft-deleted item excluded from active scope" do
    @item1.soft_delete!
    assert_not_includes ProjectItem.active, @item1
    assert_includes ProjectItem.active, @item2
  end

  test "soft-deleted item excluded from section items association" do
    @item1.soft_delete!
    assert_not_includes @section.items, @item1
    assert_includes @section.items, @item2
  end

  # ============================================================
  # ITEM RESTORE
  # ============================================================

  test "item restore! clears deleted_at" do
    @item1.soft_delete!
    @item1.restore!
    assert_nil @item1.reload.deleted_at
  end

  test "item restore! fails when parent section is soft-deleted" do
    @section.soft_delete!
    @item1.reload
    assert_raises(ActiveRecord::RecordInvalid) { @item1.restore! }
  end

  # ============================================================
  # SECTION SOFT DELETE (CASCADE)
  # ============================================================

  test "section soft_delete! cascades to active items" do
    @section.soft_delete!
    assert_not_nil @section.reload.deleted_at
    assert_not_nil @item1.reload.deleted_at
    assert_not_nil @item2.reload.deleted_at
  end

  test "section soft_delete! uses same timestamp for section and items" do
    @section.soft_delete!
    assert_equal @section.reload.deleted_at, @item1.reload.deleted_at
    assert_equal @section.reload.deleted_at, @item2.reload.deleted_at
  end

  test "section soft_delete! does not affect already-deleted items" do
    early_time = 5.minutes.ago
    @item1.update!(deleted_at: early_time)

    @section.soft_delete!

    assert_equal early_time.to_i, @item1.reload.deleted_at.to_i
    assert_equal @section.reload.deleted_at, @item2.reload.deleted_at
  end

  test "soft-deleted section excluded from project sections association" do
    @section.soft_delete!
    @project.reload
    assert_not_includes @project.sections, @section
  end

  # ============================================================
  # SECTION RESTORE (CASCADE)
  # ============================================================

  test "section restore! cascade-restores items with matching timestamp" do
    @section.soft_delete!
    @section.restore!

    assert_nil @section.reload.deleted_at
    assert_nil @item1.reload.deleted_at
    assert_nil @item2.reload.deleted_at
  end

  test "section restore! does not restore individually-deleted items" do
    # Individually delete item1 first
    @item1.soft_delete!
    item1_deleted_at = @item1.reload.deleted_at

    # Now delete the section (cascades to item2 only, item1 already deleted)
    @section.soft_delete!

    # Restore section — only item2 should be restored
    @section.restore!

    assert_nil @section.reload.deleted_at
    assert_nil @item2.reload.deleted_at
    assert_equal item1_deleted_at.to_i, @item1.reload.deleted_at.to_i
  end

  # ============================================================
  # GROUP SOFT DELETE (CASCADE)
  # ============================================================

  test "group soft_delete! cascades to sections and items" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)

    group.soft_delete!

    assert_not_nil group.reload.deleted_at
    assert_not_nil @section.reload.deleted_at
    assert_not_nil @item1.reload.deleted_at
    assert_not_nil @item2.reload.deleted_at
  end

  test "group soft_delete! uses same timestamp across all records" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)

    group.soft_delete!

    timestamp = group.reload.deleted_at
    assert_equal timestamp, @section.reload.deleted_at
    assert_equal timestamp, @item1.reload.deleted_at
    assert_equal timestamp, @item2.reload.deleted_at
  end

  test "soft-deleted group excluded from project section_groups association" do
    group = create(:section_group, project: @project)
    group.soft_delete!
    @project.reload
    assert_not_includes @project.section_groups, group
  end

  # ============================================================
  # GROUP RESTORE (CASCADE)
  # ============================================================

  test "group restore! cascade-restores sections and items with matching timestamp" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)

    group.soft_delete!
    group.restore!

    assert_nil group.reload.deleted_at
    assert_nil @section.reload.deleted_at
    assert_nil @item1.reload.deleted_at
    assert_nil @item2.reload.deleted_at
  end

  test "group restore! does not restore individually-deleted children" do
    group = create(:section_group, project: @project)
    section2 = create(:project_section, project: @project, section_group: group)
    item3 = create(:project_item, project_section: section2, name: "Item 3")
    @section.update!(section_group: group)

    # Individually delete item1 and section2 before group delete
    @item1.soft_delete!
    item1_deleted_at = @item1.reload.deleted_at
    section2.soft_delete!
    section2_deleted_at = section2.reload.deleted_at

    # Delete group — cascades only to active children
    group.soft_delete!

    # Restore group
    group.restore!

    # @section and @item2 should be restored (they were cascade-deleted)
    assert_nil group.reload.deleted_at
    assert_nil @section.reload.deleted_at
    assert_nil @item2.reload.deleted_at

    # @item1 was individually deleted — stays deleted
    assert_equal item1_deleted_at.to_i, @item1.reload.deleted_at.to_i

    # section2 was individually deleted — stays deleted
    assert_equal section2_deleted_at.to_i, section2.reload.deleted_at.to_i

    # item3 was cascade-deleted with section2 — stays deleted
    assert_not_nil item3.reload.deleted_at
  end

  test "section restore! fails when parent group is soft-deleted" do
    group = create(:section_group, project: @project)
    @section.update!(section_group: group)

    group.soft_delete!
    @section.reload

    assert_raises(ActiveRecord::RecordInvalid) { @section.restore! }
  end
end
