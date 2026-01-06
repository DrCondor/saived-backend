# frozen_string_literal: true

class AdminUser < ApplicationRecord
  devise :database_authenticatable,
         :recoverable, :rememberable, :validatable,
         :trackable, :lockable, :timeoutable

  # Ransack whitelist for ActiveAdmin (exclude sensitive fields)
  def self.ransackable_attributes(auth_object = nil)
    %w[id email name created_at updated_at sign_in_count current_sign_in_at last_sign_in_at locked_at]
  end

  def self.ransackable_associations(auth_object = nil)
    []
  end

  # Only these emails can be admin users in production
  ALLOWED_EMAILS = %w[konrad@saived.pl martyna@saived.pl].freeze

  validate :email_in_allowlist, if: -> { Rails.env.production? }

  # Devise lockable config (5 attempts, 1 hour lockout)
  def self.lock_strategy
    :failed_attempts
  end

  def self.maximum_attempts
    5
  end

  def self.unlock_strategy
    :time
  end

  def self.unlock_in
    1.hour
  end

  # Devise timeoutable config (30 minutes timeout)
  def self.timeout_in
    30.minutes
  end

  def display_name
    name.presence || email.split("@").first.titleize
  end

  def record_activity!
    update_column(:last_activity_at, Time.current)
  end

  private

  def email_in_allowlist
    unless ALLOWED_EMAILS.include?(email.downcase)
      errors.add(:email, "is not authorized for admin access")
    end
  end
end
