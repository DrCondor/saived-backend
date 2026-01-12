class ProjectMembership < ApplicationRecord
  belongs_to :project
  belongs_to :user

  ROLES = %w[owner editor viewer].freeze

  validates :role, presence: true, inclusion: { in: ROLES }
end
