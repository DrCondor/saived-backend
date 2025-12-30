class ProjectSection < ApplicationRecord
  belongs_to :project

  has_many :items,
           -> { order(position: :asc) },
           class_name: "ProjectItem",
           dependent: :destroy

  default_scope { order(position: :asc) }

  validates :name, presence: true

  def total_price
    items.sum { |i| i.total_price.to_f }
  end
end
