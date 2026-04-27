# ProjectDuplicator performs a deep-copy of a project for a given user.
#
# Usage:
#   new_project = ProjectDuplicator.new(source_project, user).call
#
# Excluded from copy: ProductCaptureSample, ItemFavorite, ProjectMembership
# (only a fresh owner membership is created for `user`).
# The Project#create_default_section callback is suppressed via the
# `skip_default_section` attr_accessor on Project.
class ProjectDuplicator
  ITEM_FIELDS = %w[
    name note quantity unit_type unit_price_cents currency category dimensions
    status external_url thumbnail_url discount_label discount_percent
    discount_code original_unit_price_cents item_type address phone position
  ].freeze

  def initialize(source, user)
    @source = source
    @user   = user
  end

  def call
    ActiveRecord::Base.transaction do
      new_project = build_project
      new_project.save!

      ProjectMembership.create!(project: new_project, user: @user, role: "owner")

      group_map = copy_section_groups(new_project)
      copy_sections_and_items(new_project, group_map)

      new_project.reload
    end
  end

  private

  def build_project
    project = Project.new(
      name:        "Kopia: #{@source.name}",
      owner:       @user,
      description: @source.description,
      favorite:    false
    )
    # Suppress the after_create :create_default_section callback
    project.skip_default_section = true
    project
  end

  def copy_section_groups(new_project)
    # Returns { old_group_id => new_group } map
    @source.section_groups.order(:position, :created_at).each_with_object({}) do |group, map|
      new_group = new_project.section_groups.create!(
        name:     group.name,
        position: group.position
      )
      map[group.id] = new_group
    end
  end

  def copy_sections_and_items(new_project, group_map)
    @source.sections.order(:position, :created_at).each do |section|
      new_section = new_project.sections.create!(
        name:             section.name,
        position:         section.position,
        section_group_id: section.section_group_id ? group_map[section.section_group_id]&.id : nil
      )

      section.items.order(:position, :created_at).each do |item|
        copy_item(item, new_section)
      end
    end
  end

  def copy_item(source_item, new_section)
    attrs = ITEM_FIELDS.each_with_object({}) { |f, h| h[f] = source_item.public_send(f) }
    new_item = new_section.items.new(attrs)
    # position is set explicitly so the before_create :set_position callback
    # won't override it (it only fires when position is nil)
    new_item.save!

    attach_file(source_item, new_item) if source_item.attachment.attached?

    new_item
  end

  def attach_file(source_item, new_item)
    new_item.attachment.attach(
      io:           StringIO.new(source_item.attachment.download),
      filename:     source_item.attachment.filename.to_s,
      content_type: source_item.attachment.content_type
    )
  end
end
