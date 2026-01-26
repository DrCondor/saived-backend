class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :invitable, :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  has_secure_token :api_token

  belongs_to :organization, optional: true

  # Ransack whitelist for ActiveAdmin (exclude sensitive fields)
  def self.ransackable_attributes(auth_object = nil)
    %w[id email first_name last_name company_name phone title created_at updated_at invitation_sent_at invitation_accepted_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[owned_projects projects product_capture_samples]
  end

  # Avatar attachment
  has_one_attached :avatar

  # Company logo for PDF branding
  has_one_attached :company_logo

  has_many :product_capture_samples, dependent: :destroy

  has_many :item_favorites, dependent: :destroy
  has_many :favorite_items, through: :item_favorites, source: :project_item

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

  # Discounts helpers
  def discounts
    preferences&.dig("discounts") || []
  end

  def update_discounts(discounts_data)
    update(preferences: (preferences || {}).merge("discounts" => discounts_data))
  end

  def discount_for_domain(domain)
    normalized = normalize_domain(domain)
    discounts.find { |d| d["domain"] == normalized }
  end

  # Apply discounts to all existing items for this user
  def apply_discounts_to_existing_items
    # Build a hash of domain -> discount for quick lookup
    discount_map = discounts.each_with_object({}) do |d, hash|
      hash[d["domain"]] = d
    end

    # Get all items from user's owned projects
    items = ProjectItem.joins(project_section: :project)
                       .where(projects: { owner_id: id })
                       .where.not(external_url: [ nil, "" ])
                       .where(item_type: "product")

    items.find_each do |item|
      domain = extract_domain_from_url(item.external_url)
      next unless domain

      discount = discount_map[domain]

      if discount
        # Apply discount
        percentage = discount["percentage"].to_i
        next if percentage <= 0

        # Use original price if available, otherwise current price
        original_cents = item.original_unit_price_cents || item.unit_price_cents
        next unless original_cents && original_cents > 0

        # Store original if not already stored
        item.original_unit_price_cents ||= item.unit_price_cents

        # Calculate new price
        discounted_cents = (original_cents * (100 - percentage) / 100.0).round
        item.unit_price_cents = discounted_cents

        # Set discount label
        code = discount["code"]
        item.discount_label = code.present? ? "-#{percentage}% (#{code})" : "-#{percentage}%"

        item.save!
      elsif item.original_unit_price_cents.present?
        # No discount for this domain but item had discount before - restore original price
        item.unit_price_cents = item.original_unit_price_cents
        item.original_unit_price_cents = nil
        item.discount_label = nil
        item.save!
      end
    end
  end

  # Extension update notification helpers
  def seen_extension_version
    preferences&.dig("seen_extension_version") || 0
  end

  def dismiss_extension_update(version)
    update(preferences: (preferences || {}).merge("seen_extension_version" => version))
  end

  private

  def normalize_domain(domain)
    domain.to_s.downcase.gsub(/^www\./, "")
  end

  def extract_domain_from_url(url)
    uri = URI.parse(url)
    host = uri.host.to_s.downcase
    host.gsub(/^www\./, "")
  rescue URI::InvalidURIError
    nil
  end
end
