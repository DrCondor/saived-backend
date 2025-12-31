require "test_helper"

class ProjectTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "valid project" do
    project = build(:project)
    assert project.valid?
  end

  test "requires name" do
    project = build(:project, name: nil)
    assert_not project.valid?
    assert_includes project.errors[:name], "can't be blank"
  end

  test "requires owner" do
    project = build(:project, owner: nil)
    assert_not project.valid?
  end

  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "belongs to owner (user)" do
    user = create(:user)
    project = create(:project, owner: user)
    assert_equal user, project.owner
  end

  test "has many sections" do
    project = create(:project)
    section = create(:project_section, project: project)
    assert_includes project.sections, section
  end

  test "destroys sections on destroy" do
    project = create(:project, :with_sections, sections_count: 2)
    section_ids = project.sections.pluck(:id)
    project.destroy
    assert_empty ProjectSection.where(id: section_ids)
  end

  test "has many project_memberships" do
    project = create(:project)
    user = create(:user)
    project.project_memberships.create!(user: user, role: "viewer")
    assert_equal 1, project.project_memberships.count
  end

  test "has many users through memberships" do
    project = create(:project)
    user = create(:user)
    project.project_memberships.create!(user: user, role: "editor")
    assert_includes project.users, user
  end

  # ============================================================
  # TOTAL PRICE
  # ============================================================

  test "total_price sums all sections" do
    project = create(:project)
    section1 = create(:project_section, project: project)
    section2 = create(:project_section, project: project)
    create(:project_item, project_section: section1, unit_price_cents: 10000, quantity: 2) # 200.0
    create(:project_item, project_section: section2, unit_price_cents: 5000, quantity: 3)  # 150.0

    assert_equal 350.0, project.total_price
  end

  test "total_price handles empty project" do
    project = create(:project)
    assert_equal 0.0, project.total_price
  end

  test "total_price handles nil prices" do
    project = create(:project)
    section = create(:project_section, project: project)
    create(:project_item, project_section: section, unit_price_cents: nil, quantity: 2)
    create(:project_item, project_section: section, unit_price_cents: 10000, quantity: 1)

    assert_equal 100.0, project.total_price
  end

  # ============================================================
  # TRAITS
  # ============================================================

  test "favorite trait sets favorite to true" do
    project = create(:project, :favorite)
    assert project.favorite
  end

  test "with_sections trait creates sections" do
    project = create(:project, :with_sections, sections_count: 3)
    assert_equal 3, project.sections.count
  end

  test "with_items trait creates sections with items" do
    project = create(:project, :with_items, sections_count: 2, items_per_section: 4)
    assert_equal 2, project.sections.count
    project.sections.each do |section|
      assert_equal 4, section.items.count
    end
  end
end
