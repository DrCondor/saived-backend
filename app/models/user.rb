class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :invitable, :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_secure_token :api_token

  # Ransack whitelist for ActiveAdmin (exclude sensitive fields)
  def self.ransackable_attributes(auth_object = nil)
    %w[id email first_name last_name company_name phone title created_at updated_at invitation_sent_at invitation_accepted_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[owned_projects projects product_capture_samples]
  end

  # Avatar attachment
  has_one_attached :avatar

  has_many :product_capture_samples, dependent: :destroy

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

  # Custom statuses helpers
  def custom_statuses
    preferences&.dig("custom_statuses") || []
  end

  def update_custom_statuses(statuses)
    update(preferences: (preferences || {}).merge("custom_statuses" => statuses))
  end
end
