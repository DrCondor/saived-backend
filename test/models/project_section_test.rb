require "test_helper"

class ProjectSectionTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "valid project section" do
    section = build(:project_section)
    assert section.valid?
  end

  test "requires name" do
    section = build(:project_section, name: nil)
    assert_not section.valid?
    assert_includes section.errors[:name], "can't be blank"
  end

  test "requires project" do
    section = build(:project_section, project: nil)
    assert_not section.valid?
  end

  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "belongs to project" do
    project = create(:project)
    section = create(:project_section, project: project)
    assert_equal project, section.project
  end

  test "has many items" do
    section = create(:project_section)
    item = create(:project_item, project_section: section)
    assert_includes section.items, item
  end

  test "destroys items on destroy" do
    section = create(:project_section, :with_items, items_count: 3)
    item_ids = section.items.pluck(:id)
    section.destroy
    assert_empty ProjectItem.where(id: item_ids)
  end

  test "items are ordered by position" do
    section = create(:project_section)
    item3 = create(:project_item, project_section: section, position: 3, name: "Third")
    item1 = create(:project_item, project_section: section, position: 1, name: "First")
    item2 = create(:project_item, project_section: section, position: 2, name: "Second")

    ordered = section.items.to_a
    assert_equal "First", ordered[0].name
    assert_equal "Second", ordered[1].name
    assert_equal "Third", ordered[2].name
  end

  # ============================================================
  # TOTAL PRICE
  # ============================================================

  test "total_price sums all items" do
    section = create(:project_section)
    create(:project_item, project_section: section, unit_price_cents: 10000, quantity: 2) # 200.0
    create(:project_item, project_section: section, unit_price_cents: 5000, quantity: 3)  # 150.0

    assert_equal 350.0, section.total_price
  end

  test "total_price handles empty section" do
    section = create(:project_section)
    assert_equal 0.0, section.total_price
  end

  test "total_price handles nil prices" do
    section = create(:project_section)
    create(:project_item, project_section: section, unit_price_cents: nil, quantity: 2)
    create(:project_item, project_section: section, unit_price_cents: 10000, quantity: 1)

    assert_equal 100.0, section.total_price
  end

  # ============================================================
  # DEFAULT SCOPE (ORDERING)
  # ============================================================

  test "sections are ordered by position by default" do
    project = create(:project)
    project.sections.destroy_all  # Remove default section for this test

    section3 = create(:project_section, project: project, position: 3, name: "Third")
    section1 = create(:project_section, project: project, position: 1, name: "First")
    section2 = create(:project_section, project: project, position: 2, name: "Second")

    ordered = project.sections.reload.to_a
    assert_equal "First", ordered[0].name
    assert_equal "Second", ordered[1].name
    assert_equal "Third", ordered[2].name
  end

  # ============================================================
  # TRAITS
  # ============================================================

  test "with_items trait creates items" do
    section = create(:project_section, :with_items, items_count: 5)
    assert_equal 5, section.items.count
  end
end
