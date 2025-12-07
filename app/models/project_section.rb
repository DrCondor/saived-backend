class ProjectSection < ApplicationRecord
  belongs_to :project

  has_many :items,
           class_name: "ProjectItem",
           dependent: :destroy

  validates :name, presence: true

  def total_price
    items.sum { |i| i.total_price.to_f }
  end
end
