require "test_helper"

class SectionGroupTest < ActiveSupport::TestCase
  test "valid section group" do
    group = build(:section_group)
    assert group.valid?
  end

  test "requires name" do
    group = build(:section_group, name: nil)
    assert_not group.valid?
    assert_includes group.errors[:name], "can't be blank"
  end

  test "requires project" do
    group = build(:section_group, project: nil)
    assert_not group.valid?
  end

  test "total_price sums section totals" do
    group = create(:section_group)
    section = create(:project_section, project: group.project, section_group: group)
    create(:project_item, project_section: section, unit_price_cents: 10000, quantity: 2)
    create(:project_item, project_section: section, unit_price_cents: 5000, quantity: 1)

    assert_equal 250.0, group.total_price
  end

  test "destroying group cascades to sections and items" do
    group = create(:section_group)
    section = create(:project_section, project: group.project, section_group: group)
    item = create(:project_item, project_section: section)

    group.destroy

    assert_nil ProjectSection.find_by(id: section.id)
    assert_nil ProjectItem.find_by(id: item.id)
  end

  test "default scope orders by position" do
    project = create(:project)
    group_b = create(:section_group, project: project, position: 2)
    group_a = create(:section_group, project: project, position: 1)

    assert_equal [ group_a.id, group_b.id ], project.section_groups.pluck(:id)
  end
end
