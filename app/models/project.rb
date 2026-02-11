class Project < ApplicationRecord
  belongs_to :owner,
            class_name: "User",
            inverse_of: :owned_projects

  has_many :project_memberships, dependent: :destroy
  has_many :users, through: :project_memberships

  has_many :sections,
           -> { active },
           class_name: "ProjectSection",
           dependent: :destroy

  has_many :all_sections,
           class_name: "ProjectSection",
           dependent: :destroy

  has_many :section_groups,
           -> { active },
           dependent: :destroy

  has_many :all_section_groups,
           class_name: "SectionGroup",
           dependent: :destroy

  validates :name, presence: true

  after_create :create_default_section

  def total_price
    sections.includes(:items).sum { |s| s.total_price.to_f }
  end

  private

  def create_default_section
    sections.create!(name: "Nowa sekcja", position: 1)
  end
end
