class SectionGroup < ApplicationRecord
  belongs_to :project

  has_many :sections,
           class_name: "ProjectSection",
           dependent: :destroy

  default_scope { order(position: :asc) }

  validates :name, presence: true

  def total_price
    sections.includes(:items).sum { |s| s.total_price.to_f }
  end
end
