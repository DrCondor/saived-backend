require "test_helper"

class ProjectDuplicatorTest < ActiveSupport::TestCase
  setup do
    @owner = create(:user)
    @other_user = create(:user)

    # Build a source project with sections, groups, and items
    @source = create(:project, owner: @owner, name: "Original", favorite: true, description: "Opis projektu")
    # Remove the default section created by after_create callback
    @source.sections.destroy_all

    # Add a section group
    @group = SectionGroup.create!(project: @source, name: "Grupa A", position: 0)

    # Section inside the group
    @section_in_group = ProjectSection.create!(project: @source, name: "Sekcja 1", position: 0, section_group: @group)
    # Section outside group (ungrouped)
    @section_ungrouped = ProjectSection.create!(project: @source, name: "Sekcja 2", position: 1)

    @item1 = create(:project_item, project_section: @section_in_group, name: "Krzesło", position: 0,
                    note: "notatka", quantity: 2, unit_price_cents: 50000, currency: "PLN",
                    category: "Meble", status: "Wybrane", item_type: "product")
    @item2 = create(:project_item, project_section: @section_ungrouped, name: "Malowanie", position: 0,
                    item_type: "contractor", phone: "123456789", address: "ul. Testowa 1")
  end

  # ============================================================
  # 5.1 Success path — counts and structure
  # ============================================================

  test "returns a persisted Project" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert result.is_a?(Project)
    assert result.persisted?
  end

  test "new project name is prefixed with Kopia:" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal "Kopia: Original", result.name
  end

  test "new project owner is the requesting user" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal @other_user.id, result.owner_id
  end

  test "new project copies description" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal "Opis projektu", result.description
  end

  test "section group count matches source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal @source.section_groups.count, result.section_groups.count
  end

  test "section count matches source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal @source.sections.count, result.sections.count
  end

  test "item count matches source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    total_source_items = ProjectItem.joins(:project_section).where(project_sections: { project_id: @source.id }).count
    total_new_items = ProjectItem.joins(:project_section).where(project_sections: { project_id: result.id }).count
    assert_equal total_source_items, total_new_items
  end

  test "section names match source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    source_names = @source.sections.order(:position).pluck(:name)
    new_names = result.sections.order(:position).pluck(:name)
    assert_equal source_names, new_names
  end

  test "section positions match source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    source_positions = @source.sections.order(:position).pluck(:position)
    new_positions = result.sections.order(:position).pluck(:position)
    assert_equal source_positions, new_positions
  end

  test "section group membership is remapped (sections linked to new groups not source groups)" do
    result = ProjectDuplicator.new(@source, @other_user).call
    # All section_group_ids in new project reference new groups (not source groups)
    new_group_ids = result.section_groups.pluck(:id).to_set
    result.sections.each do |s|
      next if s.section_group_id.nil?
      assert new_group_ids.include?(s.section_group_id),
             "Section #{s.name} still references a source group ID #{s.section_group_id}"
    end
  end

  test "item fields are copied verbatim" do
    result = ProjectDuplicator.new(@source, @other_user).call
    new_section = result.sections.find_by(name: "Sekcja 1")
    new_item = new_section.items.first

    assert_equal "Krzesło", new_item.name
    assert_equal "notatka", new_item.note
    assert_equal 2, new_item.quantity.to_i
    assert_equal 50000, new_item.unit_price_cents
    assert_equal "PLN", new_item.currency
    assert_equal "Meble", new_item.category
    assert_equal "Wybrane", new_item.status
    assert_equal "product", new_item.item_type
  end

  test "contractor item fields are copied verbatim" do
    result = ProjectDuplicator.new(@source, @other_user).call
    new_section = result.sections.find_by(name: "Sekcja 2")
    new_item = new_section.items.first

    assert_equal "Malowanie", new_item.name
    assert_equal "contractor", new_item.item_type
    assert_equal "123456789", new_item.phone
    assert_equal "ul. Testowa 1", new_item.address
  end

  test "item positions match source" do
    result = ProjectDuplicator.new(@source, @other_user).call

    source_positions = ProjectItem.joins(:project_section)
                                  .where(project_sections: { project_id: @source.id })
                                  .order("project_sections.position, project_items.position")
                                  .pluck(:position)
    new_positions = ProjectItem.joins(:project_section)
                               .where(project_sections: { project_id: result.id })
                               .order("project_sections.position, project_items.position")
                               .pluck(:position)
    assert_equal source_positions, new_positions
  end

  # ============================================================
  # 5.2 ActiveStorage attachment duplication
  # ============================================================

  test "attachment is cloned as an independent blob" do
    # Attach a file to item1
    @item1.attachment.attach(
      io: StringIO.new("fake pdf content"),
      filename: "test.pdf",
      content_type: "application/pdf"
    )
    assert @item1.attachment.attached?

    result = ProjectDuplicator.new(@source, @other_user).call

    new_section = result.sections.find_by(name: "Sekcja 1")
    new_item = new_section.items.first
    assert new_item.attachment.attached?, "Duplicate item should have attachment"
    assert_not_equal @item1.attachment.blob.id, new_item.attachment.blob.id,
                     "Duplicate should have a different blob"
  end

  test "duplicate attachment survives source destruction" do
    @item1.attachment.attach(
      io: StringIO.new("independent content"),
      filename: "doc.pdf",
      content_type: "application/pdf"
    )

    result = ProjectDuplicator.new(@source, @other_user).call
    new_section = result.sections.find_by(name: "Sekcja 1")
    new_item = new_section.items.first

    # Destroy the source project
    @source.destroy

    assert new_item.reload.attachment.attached?, "Attachment should survive source destruction"
    assert_equal "independent content", new_item.attachment.download
  end

  # ============================================================
  # 5.3 favorite is forced to false
  # ============================================================

  test "favorite is false regardless of source value" do
    assert @source.favorite, "Source should be favorite for this test"
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_not result.favorite, "Duplicate should not be favorite"
  end

  # ============================================================
  # 5.4 No ProductCaptureSample / ItemFavorite / extra memberships
  # ============================================================

  test "no ProductCaptureSample rows are created for the duplicate" do
    # Add a capture sample on source item
    ProductCaptureSample.create!(
      user: @owner,
      project_item: @item1,
      url: "https://example.com/product",
      domain: "example.com",
      raw_payload: {},
      final_payload: {},
      context: {}
    )

    result = ProjectDuplicator.new(@source, @other_user).call
    new_item_ids = result.sections.flat_map { |s| s.items.pluck(:id) }
    assert_equal 0, ProductCaptureSample.where(project_item_id: new_item_ids).count
  end

  test "no ItemFavorite rows are created for duplicated items" do
    # Favorite the source item
    ItemFavorite.create!(user: @owner, project_item: @item1)

    result = ProjectDuplicator.new(@source, @other_user).call
    new_item_ids = result.sections.flat_map { |s| s.items.pluck(:id) }
    assert_equal 0, ItemFavorite.where(project_item_id: new_item_ids).count
  end

  test "only one ProjectMembership (owner) exists for the duplicate" do
    result = ProjectDuplicator.new(@source, @other_user).call
    memberships = result.project_memberships
    assert_equal 1, memberships.count
    assert_equal "owner", memberships.first.role
    assert_equal @other_user.id, memberships.first.user_id
  end

  # ============================================================
  # 5.5 create_default_section suppressed
  # ============================================================

  test "create_default_section is not called - section count equals source" do
    result = ProjectDuplicator.new(@source, @other_user).call
    assert_equal @source.sections.count, result.sections.count,
                 "Extra 'Nowa sekcja' must not appear on the duplicate"
  end

  test "no section named Nowa sekcja is prepended by the callback" do
    result = ProjectDuplicator.new(@source, @other_user).call
    section_names = result.sections.pluck(:name)
    assert_equal 0, section_names.count { |n| n == "Nowa sekcja" },
                 "No default section should be prepended"
  end

  # ============================================================
  # 5.6 Transaction rollback
  # ============================================================

  test "no records are persisted if a child save raises" do
    project_count_before = Project.count
    section_count_before = ProjectSection.count
    item_count_before = ProjectItem.count
    membership_count_before = ProjectMembership.count

    # Subclass that raises when it tries to copy items (mid-copy failure)
    failing_duplicator = Class.new(ProjectDuplicator) do
      private
      def copy_item(source_item, new_section)
        raise ActiveRecord::RecordInvalid.new(source_item), "forced failure in test"
      end
    end

    assert_raises(ActiveRecord::RecordInvalid) do
      failing_duplicator.new(@source, @other_user).call
    end

    assert_equal project_count_before, Project.count, "No new Project should persist"
    assert_equal section_count_before, ProjectSection.count, "No new ProjectSection should persist"
    assert_equal item_count_before, ProjectItem.count, "No new ProjectItem should persist"
    assert_equal membership_count_before, ProjectMembership.count, "No new ProjectMembership should persist"
  end
end
