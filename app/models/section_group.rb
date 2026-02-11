class SectionGroup < ApplicationRecord
  belongs_to :project

  has_many :sections,
           -> { active },
           class_name: "ProjectSection",
           dependent: :destroy

  has_many :all_sections,
           class_name: "ProjectSection",
           dependent: :destroy

  default_scope { order(position: :asc) }

  # Soft delete
  scope :active, -> { where(deleted_at: nil) }

  def soft_delete!
    now = Time.current
    transaction do
      update!(deleted_at: now)
      all_sections.active.each do |section|
        section.update!(deleted_at: now)
        section.all_items.active.update_all(deleted_at: now)
      end
    end
  end

  def restore!
    original_deleted_at = deleted_at
    transaction do
      update!(deleted_at: nil)
      restored_section_ids = ProjectSection.unscoped
                                           .where(section_group_id: id, deleted_at: original_deleted_at)
                                           .pluck(:id)
      ProjectSection.unscoped
                    .where(id: restored_section_ids)
                    .update_all(deleted_at: nil)
      ProjectItem.unscoped
                 .where(project_section_id: restored_section_ids, deleted_at: original_deleted_at)
                 .update_all(deleted_at: nil)
    end
  end

  validates :name, presence: true

  def total_price
    sections.includes(:items).sum { |s| s.total_price.to_f }
  end
end
