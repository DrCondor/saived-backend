class ProjectItem < ApplicationRecord
  belongs_to :project_section
  has_many :product_capture_samples, dependent: :nullify
  has_many :item_favorites, dependent: :destroy
  has_one_attached :attachment

  # Soft delete
  scope :active, -> { where(deleted_at: nil) }

  def soft_delete!
    update!(deleted_at: Time.current)
  end

  def restore!
    if project_section.deleted_at.present?
      raise ActiveRecord::RecordInvalid.new(self), "Parent section is soft-deleted"
    end
    update!(deleted_at: nil)
  end

  # Item types
  ITEM_TYPES = %w[product contractor note].freeze

  validates :name, presence: true
  validates :quantity, numericality: { greater_than: 0 }, if: :product?
  validates :status, presence: true
  validates :item_type, inclusion: { in: ITEM_TYPES }

  # Default status for new items
  attribute :status, :string, default: "bez_statusu"

  # Set position based on item type:
  # - Contractors go to the BEGINNING of the list
  # - Products go to the END of the list
  before_create :set_position

  def set_position
    return if position.present? && position != 0

    if contractor?
      # Contractors: insert at beginning (before all existing items)
      min_position = project_section.items.minimum(:position) || 0
      self.position = min_position - 1
    else
      # Products & Notes: insert at end (after all existing items)
      max_position = project_section.items.maximum(:position) || -1
      self.position = max_position + 1
    end
  end

  # -------------------------
  # ITEM TYPE HELPERS
  # -------------------------

  def product?
    item_type == "product"
  end

  def contractor?
    item_type == "contractor"
  end

  def note?
    item_type == "note"
  end

  # Unit types for quantity measurement
  UNIT_TYPES = {
    "szt" => { label: "szt.", full_name: "sztuka" },
    "kpl" => { label: "kpl.", full_name: "komplet" },
    "zestaw" => { label: "zestaw", full_name: "zestaw" },
    "opak" => { label: "opak.", full_name: "opakowanie" },
    "mb" => { label: "mb.", full_name: "metr bieżący" },
    "m2" => { label: "m²", full_name: "metr kwadratowy" },
    "m3" => { label: "m³", full_name: "metr sześcienny" },
    "l" => { label: "l", full_name: "litr" },
    "kg" => { label: "kg", full_name: "kilogram" }
  }.freeze

  def unit_type_label
    UNIT_TYPES.dig(unit_type, :label) || "szt."
  end

  # System statuses with their configuration
  SYSTEM_STATUSES = {
    "propozycja" => { include_in_sum: false, color: "neutral", label: "PROPOZYCJA" },
    "do_wyceny" => { include_in_sum: true, color: "amber", label: "DO WYCENY" },
    "kupione" => { include_in_sum: true, color: "emerald", label: "KUPIONE" },
    "bez_statusu" => { include_in_sum: true, color: "slate", label: "BEZ STATUSU" }
  }.freeze

  # -------------------------
  # PRICE HANDLING (GENERIC)
  # -------------------------

  # getter do formularzy (zł, €, $ – zależnie od waluty)
  def unit_price
    return nil unless unit_price_cents
    unit_price_cents / 100.0
  end

  # setter z formularza
  def unit_price=(value)
    if value.present?
      normalized = value.to_s.tr(",", ".")
      self.unit_price_cents = (normalized.to_f * 100).round
    else
      self.unit_price_cents = nil
    end
  end

  def total_price
    # Notes don't have a price - they don't affect the sum
    return 0 if note?

    return nil unless unit_price_cents
    if contractor?
      # Contractors have a flat price (no quantity multiplication)
      unit_price_cents / 100.0
    else
      # Products: price × quantity
      return nil unless quantity
      (unit_price_cents * quantity) / 100.0
    end
  end

  # -------------------------
  # DISPLAY HELPERS
  # -------------------------

  def formatted_unit_price
    return "—" unless unit_price
    format_price(unit_price)
  end

  def formatted_total_price
    return "—" unless total_price
    format_price(total_price)
  end

  def format_price(amount)
    unit = currency.presence || "PLN"

    ActionController::Base.helpers.number_to_currency(
      amount,
      unit: "#{unit} ",
      precision: 2
    )
  end

  # -------------------------
  # OTHER
  # -------------------------

  def project
    project_section.project
  end

  def thumbnail
    thumbnail_url.presence
  end

  # -------------------------
  # STATUS HELPERS
  # -------------------------

  # Check if this item should be included in sum calculations
  def include_in_sum?
    # Check system statuses first
    if SYSTEM_STATUSES.key?(status)
      return SYSTEM_STATUSES[status][:include_in_sum]
    end

    # Check custom statuses from project owner
    owner = project_section&.project&.owner
    return true unless owner

    custom = owner.custom_statuses.find { |s| s["id"] == status }
    custom ? custom["include_in_sum"] : true
  end
end
