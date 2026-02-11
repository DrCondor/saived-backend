class ProjectSection < ApplicationRecord
  belongs_to :project
  belongs_to :section_group, optional: true

  has_many :items,
           -> { active.order(position: :asc) },
           class_name: "ProjectItem",
           dependent: :destroy

  has_many :all_items,
           -> { order(position: :asc) },
           class_name: "ProjectItem",
           dependent: :destroy

  default_scope { order(position: :asc) }

  # Soft delete
  scope :active, -> { where(deleted_at: nil) }

  def soft_delete!
    now = Time.current
    transaction do
      update!(deleted_at: now)
      all_items.active.update_all(deleted_at: now)
    end
  end

  def restore!
    if section_group&.deleted_at.present?
      raise ActiveRecord::RecordInvalid.new(self), "Parent group is soft-deleted"
    end
    original_deleted_at = deleted_at
    transaction do
      update!(deleted_at: nil)
      ProjectItem.unscoped
                 .where(project_section_id: id, deleted_at: original_deleted_at)
                 .update_all(deleted_at: nil)
    end
  end

  validates :name, presence: true

  def total_price
    items.select(&:include_in_sum?).sum { |i| i.total_price.to_f }
  end
end
