class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_secure_token :api_token

  has_many :owned_projects,
           class_name: "Project",
           foreign_key: :owner_id,
           inverse_of: :owner,
           dependent: :destroy

  has_many :project_memberships, dependent: :destroy
  has_many :projects, through: :project_memberships
end
