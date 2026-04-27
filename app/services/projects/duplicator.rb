# frozen_string_literal: true

module Projects
  # Deep-copies a project for a user.
  #
  # Usage:
  #   new_project = Projects::Duplicator.new(source_project, current_user).call
  #
  # The entire copy is wrapped in a single transaction. Any failure rolls back
  # all new rows so no partial project is left behind.
  #
  # Thread-safety: the default-section callback is suppressed via a thread-local
  # flag (Thread.current[:saived_skip_default_section]) that is always cleared
  # in an ensure block, making it safe under Puma's multi-threaded server.
  #
  # TODO: if projects grow beyond ~500 items, consider a Sidekiq job instead
  # of a synchronous request.
  class Duplicator
    # Attributes to copy verbatim from each ProjectItem.
    # Excludes: id, created_at, updated_at, project_section_id (set to new section),
    #           deleted_at (always nil on copies), attachment blobs, ItemFavorite rows,
    #           ProductCaptureSample rows, ProjectMembership rows.
    ITEM_COPY_ATTRIBUTES = %w[
      item_type name note quantity unit_type
      unit_price_cents currency
      original_unit_price_cents discount_label discount_percent discount_code
      category dimensions status position
      external_url thumbnail_url
      phone address
    ].freeze

    def initialize(source_project, current_user)
      @source = source_project
      @user   = current_user
    end

    # Returns the new Project (already persisted).
    # Raises ActiveRecord::RecordInvalid on validation failure.
    def call
      ActiveRecord::Base.transaction do
        with_default_section_suppressed do
          new_project = build_project
          new_project.save!
          create_owner_membership(new_project)
          group_id_map = copy_section_groups(new_project)
          copy_sections_and_items(new_project, group_id_map)
          new_project
        end
      end
    end

    private

    def with_default_section_suppressed
      Thread.current[:saived_skip_default_section] = true
      yield
    ensure
      Thread.current[:saived_skip_default_section] = nil
    end

    def build_project
      @user.owned_projects.new(
        name:        "#{@source.name} (kopia)",
        description: @source.description,
        favorite:    false,
        position:    nil
      )
    end

    def create_owner_membership(project)
      ProjectMembership.create!(project: project, user: @user, role: "owner")
    end

    def copy_section_groups(new_project)
      id_map = {}
      # @source.section_groups uses the `active` default scope (deleted_at: nil)
      @source.section_groups.order(:position, :created_at).each do |group|
        new_group = new_project.section_groups.create!(
          name:     group.name,
          position: group.position
        )
        id_map[group.id] = new_group.id
      end
      id_map
    end

    def copy_sections_and_items(new_project, group_id_map)
      # @source.sections uses the `active` scope + default_scope order
      @source.sections.includes(:items).each do |section|
        new_section = new_project.sections.create!(
          name:             section.name,
          position:         section.position,
          section_group_id: section.section_group_id ? group_id_map[section.section_group_id] : nil
        )
        # section.items is scoped to active + ordered by position via the association
        section.items.each do |item|
          new_item = ProjectItem.new(item.attributes.slice(*ITEM_COPY_ATTRIBUTES))
          new_item.project_section = new_section
          # save! runs validations; position is already set so set_position early-returns
          new_item.save!
        end
      end
    end
  end
end
