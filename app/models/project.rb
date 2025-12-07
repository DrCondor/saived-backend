class Project < ApplicationRecord
  belongs_to :owner,
            class_name: "User",
            inverse_of: :owned_projects

  has_many :project_memberships, dependent: :destroy
  has_many :users, through: :project_memberships

  has_many :sections,
           class_name: "ProjectSection",
           dependent: :destroy

  validates :name, presence: true

  def total_price
    sections.includes(:items).sum { |s| s.total_price.to_f }
  end
end
