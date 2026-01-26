class Organization < ApplicationRecord
  has_one :user
  has_one_attached :logo

  # Ransack whitelist for ActiveAdmin
  def self.ransackable_attributes(auth_object = nil)
    %w[id name nip phone created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[user logo_attachment logo_blob]
  end
end
