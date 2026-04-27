require "test_helper"

class Projects::DuplicatorTest < ActiveSupport::TestCase
  setup do
    @owner = create(:user)
    @project = create(:project, owner: @owner, name: "Salon Kowalskich", description: "Opis projektu")
    @project.project_memberships.create!(user: @owner, role: "owner")
    # Remove the default "Nowa sekcja" created by after_create callback
    @project.sections.destroy_all
  end

  # ============================================================
  # HAPPY PATH
  # ============================================================

  test "copies project name with (kopia) suffix" do
    result = Projects::Duplicator.new(@project, @owner).call
    assert_equal "Salon Kowalskich (kopia)", result.name
  end

  test "copies description" do
    result = Projects::Duplicator.new(@project, @owner).call
    assert_equal @project.description, result.description
  end

  test "new project favorite is false" do
    @project.update!(favorite: true)
    result = Projects::Duplicator.new(@project, @owner).call
    assert_equal false, result.favorite
  end

  test "new project position is nil" do
    @project.update!(position: 5)
    result = Projects::Duplicator.new(@project, @owner).call
    assert_nil result.position
  end

  test "new project owner is current_user" do
    result = Projects::Duplicator.new(@project, @owner).call
    assert_equal @owner.id, result.owner_id
  end

  # ============================================================
  # MEMBERSHIPS
  # ============================================================

  test "creates exactly one owner membership for current_user" do
    result = Projects::Duplicator.new(@project, @owner).call
    memberships = result.project_memberships
    assert_equal 1, memberships.count
    assert_equal "owner", memberships.first.role
    assert_equal @owner.id, memberships.first.user_id
  end

  test "does not copy non-owner memberships from source" do
    editor = create(:user)
    @project.project_memberships.create!(user: editor, role: "editor")

    result = Projects::Duplicator.new(@project, @owner).call
    assert_equal 1, result.project_memberships.count
    assert_not result.project_memberships.exists?(user_id: editor.id)
  end

  # ============================================================
  # SECTION GROUPS
  # ============================================================

  test "copies active section groups with name and position" do
    group1 = create(:section_group, project: @project, name: "Salon", position: 0)
    group2 = create(:section_group, project: @project, name: "Sypialnia", position: 1)

    result = Projects::Duplicator.new(@project, @owner).call

    new_groups = result.section_groups.order(:position)
    assert_equal 2, new_groups.count
    assert_equal "Salon", new_groups[0].name
    assert_equal 0, new_groups[0].position
    assert_equal "Sypialnia", new_groups[1].name
    assert_equal 1, new_groups[1].position
  end

  test "new section groups have different ids from source groups" do
    group = create(:section_group, project: @project, name: "Salon", position: 0)

    result = Projects::Duplicator.new(@project, @owner).call

    new_group = result.section_groups.first
    assert_not_equal group.id, new_group.id
  end

  test "excludes soft-deleted section groups" do
    active_group = create(:section_group, project: @project, name: "Salon", position: 0)
    deleted_group = create(:section_group, project: @project, name: "Deleted Group", position: 1)
    deleted_group.update_column(:deleted_at, Time.current)

    result = Projects::Duplicator.new(@project, @owner).call

    assert_equal 1, result.section_groups.count
    assert_equal "Salon", result.section_groups.first.name
  end

  # ============================================================
  # SECTIONS
  # ============================================================

  test "copies active sections with name and position" do
    sec1 = create(:project_section, project: @project, name: "Meble", position: 1)
    sec2 = create(:project_section, project: @project, name: "Oświetlenie", position: 2)

    result = Projects::Duplicator.new(@project, @owner).call

    new_sections = result.sections.order(:position)
    assert_equal 2, new_sections.count
    assert_equal "Meble", new_sections[0].name
    assert_equal 1, new_sections[0].position
    assert_equal "Oświetlenie", new_sections[1].name
    assert_equal 2, new_sections[1].position
  end

  test "excludes soft-deleted sections" do
    active_sec = create(:project_section, project: @project, name: "Meble", position: 1)
    deleted_sec = create(:project_section, project: @project, name: "Deleted", position: 2)
    deleted_sec.update_column(:deleted_at, Time.current)

    result = Projects::Duplicator.new(@project, @owner).call

    assert_equal 1, result.sections.count
    assert_equal "Meble", result.sections.first.name
  end

  test "remaps section_group_id to new group ids" do
    group = create(:section_group, project: @project, name: "Salon", position: 0)
    sec = create(:project_section, project: @project, name: "Meble", position: 1, section_group: group)

    result = Projects::Duplicator.new(@project, @owner).call

    new_group = result.section_groups.first
    new_section = result.sections.first
    assert_not_nil new_section.section_group_id
    assert_equal new_group.id, new_section.section_group_id
    assert_not_equal group.id, new_section.section_group_id
  end

  test "sections with nil section_group_id remain nil" do
    create(:project_section, project: @project, name: "Ungrouped", position: 1, section_group: nil)

    result = Projects::Duplicator.new(@project, @owner).call

    assert_nil result.sections.first.section_group_id
  end

  # ============================================================
  # ITEMS
  # ============================================================

  test "copies active items with whitelisted attributes" do
    section = create(:project_section, project: @project, name: "Meble", position: 1)
    item = create(:project_item,
      project_section: section,
      name: "Sofa",
      note: "Uwagi do sofy",
      quantity: 2,
      unit_type: "szt",
      unit_price_cents: 50000,
      currency: "PLN",
      category: "Meble",
      dimensions: "200x90x80 cm",
      status: "kupione",
      position: 3,
      external_url: "https://example.com/sofa",
      thumbnail_url: "https://example.com/sofa.jpg",
      discount_label: "-10%",
      discount_percent: 10.0,
      discount_code: "SAVE10"
    )
    item.update_column(:original_unit_price_cents, 55000)

    result = Projects::Duplicator.new(@project, @owner).call

    new_section = result.sections.first
    assert_equal 1, new_section.items.count
    new_item = new_section.items.first

    assert_equal "Sofa", new_item.name
    assert_equal "Uwagi do sofy", new_item.note
    assert_equal 2, new_item.quantity
    assert_equal "szt", new_item.unit_type
    assert_equal 50000, new_item.unit_price_cents
    assert_equal "PLN", new_item.currency
    assert_equal "Meble", new_item.category
    assert_equal "200x90x80 cm", new_item.dimensions
    assert_equal "kupione", new_item.status
    assert_equal 3, new_item.position
    assert_equal "https://example.com/sofa", new_item.external_url
    assert_equal "https://example.com/sofa.jpg", new_item.thumbnail_url
    assert_equal "-10%", new_item.discount_label
    assert_equal 10.0, new_item.discount_percent
    assert_equal "SAVE10", new_item.discount_code
    assert_equal 55000, new_item.original_unit_price_cents
  end

  test "negative contractor position is preserved verbatim" do
    section = create(:project_section, project: @project, name: "Wykonawcy", position: 1)
    item = ProjectItem.new(
      project_section: section,
      name: "Malarz",
      item_type: "contractor",
      status: "bez_statusu",
      unit_price_cents: 200000
    )
    item.save!
    # Manually set position to -2 (as would happen if inserted among others)
    item.update_column(:position, -2)

    result = Projects::Duplicator.new(@project, @owner).call

    new_section = result.sections.first
    new_item = new_section.items.order(:position).first
    assert_equal(-2, new_item.position)
  end

  test "excludes soft-deleted items" do
    section = create(:project_section, project: @project, name: "Meble", position: 1)
    active_item = create(:project_item, project_section: section, name: "Sofa", position: 1)
    deleted_item = create(:project_item, project_section: section, name: "Deleted Item", position: 2)
    deleted_item.update_column(:deleted_at, Time.current)

    result = Projects::Duplicator.new(@project, @owner).call

    new_section = result.sections.first
    assert_equal 1, new_section.items.count
    assert_equal "Sofa", new_section.items.first.name
  end

  test "does not copy ProductCaptureSample records" do
    section = create(:project_section, project: @project, name: "Meble", position: 1)
    item = create(:project_item, project_section: section, name: "Sofa", position: 1)
    create(:product_capture_sample, project_item: item)

    result = Projects::Duplicator.new(@project, @owner).call

    new_section = result.sections.first
    new_item = new_section.items.first
    assert_equal 0, new_item.product_capture_samples.count
  end

  test "does not copy ItemFavorite records" do
    section = create(:project_section, project: @project, name: "Meble", position: 1)
    item = create(:project_item, project_section: section, name: "Sofa", position: 1)
    create(:item_favorite, user: @owner, project_item: item)

    result = Projects::Duplicator.new(@project, @owner).call

    new_section = result.sections.first
    new_item = new_section.items.first
    assert_equal 0, new_item.item_favorites.count
  end

  # ============================================================
  # DEFAULT SECTION SUPPRESSION
  # ============================================================

  test "does not create a default Nowa sekcja section" do
    source_sections = create_list(:project_section, 2, project: @project)
    # source has 2 sections; duplicate should have exactly 2

    result = Projects::Duplicator.new(@project, @owner).call

    assert_equal 2, result.sections.count
    assert_not result.sections.any? { |s| s.name == "Nowa sekcja" }
  end

  test "thread flag is cleared after successful call" do
    create(:project_section, project: @project, name: "Meble", position: 1)
    Projects::Duplicator.new(@project, @owner).call
    assert_nil Thread.current[:saived_skip_default_section]
  end

  test "thread flag is cleared even when an exception is raised" do
    # Simulate a failure mid-call by overriding build_project via singleton method
    dup = Projects::Duplicator.new(@project, @owner)
    dup.define_singleton_method(:build_project) { raise ActiveRecord::RecordInvalid.new(@project) }
    assert_raises(ActiveRecord::RecordInvalid) { dup.call }
    assert_nil Thread.current[:saived_skip_default_section]
  end

  # ============================================================
  # ATOMICITY
  # ============================================================

  test "rolls back entirely on mid-stream failure" do
    # Create a source with 2 sections each with 1 item
    section1 = create(:project_section, project: @project, name: "Section 1", position: 1)
    section2 = create(:project_section, project: @project, name: "Section 2", position: 2)
    create(:project_item, project_section: section1, name: "Item 1", position: 1)
    create(:project_item, project_section: section2, name: "Item 2", position: 1)

    # Count before
    project_count_before = Project.count
    section_count_before = ProjectSection.unscoped.count
    item_count_before = ProjectItem.unscoped.count
    membership_count_before = ProjectMembership.count

    # Raise after project is saved but during section/item copy
    # Using Minitest's stub on the instance via a module
    dup = Projects::Duplicator.new(@project, @owner)
    dup.define_singleton_method(:copy_sections_and_items) { |_proj, _map| raise "simulated mid-stream failure" }

    assert_raises(RuntimeError) { dup.call }

    # All counts should be unchanged (transaction rolled back)
    assert_equal project_count_before, Project.count
    assert_equal section_count_before, ProjectSection.unscoped.count
    assert_equal item_count_before, ProjectItem.unscoped.count
    assert_equal membership_count_before, ProjectMembership.count
  end
end
