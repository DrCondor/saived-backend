class ProjectMembership < ApplicationRecord
  belongs_to :project
  belongs_to :user

  ROLES = %w[owner editor viewer client].freeze

  validates :role, presence: true
end
