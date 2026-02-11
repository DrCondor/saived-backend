require "test_helper"
require "rake"

class SoftDeletesCleanupTest < ActiveSupport::TestCase
  setup do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task["soft_deletes:cleanup"].reenable

    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
  end

  test "destroys records older than 1 hour" do
    section = create(:project_section, project: @project)
    item = create(:project_item, project_section: section)
    group = create(:section_group, project: @project)

    # Soft-delete all, then backdate to 2 hours ago
    old_time = 2.hours.ago
    item.update_columns(deleted_at: old_time)
    section.update_columns(deleted_at: old_time)
    group.update_columns(deleted_at: old_time)

    Rake::Task["soft_deletes:cleanup"].invoke

    assert_nil ProjectItem.unscoped.find_by(id: item.id)
    assert_nil ProjectSection.unscoped.find_by(id: section.id)
    assert_nil SectionGroup.unscoped.find_by(id: group.id)
  end

  test "preserves records newer than 1 hour" do
    section = create(:project_section, project: @project)
    item = create(:project_item, project_section: section)
    group = create(:section_group, project: @project)

    # Soft-delete recently (30 minutes ago)
    recent_time = 30.minutes.ago
    item.update_columns(deleted_at: recent_time)
    section.update_columns(deleted_at: recent_time)
    group.update_columns(deleted_at: recent_time)

    Rake::Task["soft_deletes:cleanup"].invoke

    assert_not_nil ProjectItem.unscoped.find_by(id: item.id)
    assert_not_nil ProjectSection.unscoped.find_by(id: section.id)
    assert_not_nil SectionGroup.unscoped.find_by(id: group.id)
  end

  test "deletes items before sections before groups" do
    group = create(:section_group, project: @project)
    section = create(:project_section, project: @project, section_group: group)
    item = create(:project_item, project_section: section)

    old_time = 2.hours.ago
    item.update_columns(deleted_at: old_time)
    section.update_columns(deleted_at: old_time)
    group.update_columns(deleted_at: old_time)

    # Should not raise — items are deleted before sections before groups
    assert_nothing_raised { Rake::Task["soft_deletes:cleanup"].invoke }

    assert_nil ProjectItem.unscoped.find_by(id: item.id)
    assert_nil ProjectSection.unscoped.find_by(id: section.id)
    assert_nil SectionGroup.unscoped.find_by(id: group.id)
  end
end
