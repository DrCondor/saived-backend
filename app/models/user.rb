class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_secure_token :api_token

  # Avatar attachment
  has_one_attached :avatar

  has_many :product_capture_samples, dependent: :nullify

  has_many :owned_projects,
           class_name: "Project",
           foreign_key: :owner_id,
           inverse_of: :owner,
           dependent: :destroy

  has_many :project_memberships, dependent: :destroy
  has_many :projects, through: :project_memberships

  # Profile helpers
  def full_name
    [ first_name, last_name ].compact_blank.join(" ").presence
  end

  def display_name
    full_name || email.split("@").first
  end

  def initials
    if first_name.present? && last_name.present?
      "#{first_name[0]}#{last_name[0]}".upcase
    elsif first_name.present?
      first_name[0..1].upcase
    else
      email[0..1].upcase
    end
  end
end
