class DomainSelector < ApplicationRecord
  TRACKABLE_FIELDS = %w[name price thumbnail_url].freeze
  DISCOVERY_METHODS = %w[heuristic discovered manual].freeze

  # Ransack whitelist for ActiveAdmin
  def self.ransackable_attributes(auth_object = nil)
    %w[id domain field_name selector success_count failure_count discovery_method discovery_score last_seen_at created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    []
  end

  validates :domain, :field_name, :selector, presence: true
  validates :field_name, inclusion: { in: TRACKABLE_FIELDS }
  validates :selector, uniqueness: { scope: [ :domain, :field_name ] }
  validates :discovery_method, inclusion: { in: DISCOVERY_METHODS }

  before_validation :normalize_domain

  # Match both "domain.com" and "www.domain.com"
  scope :for_domain, ->(domain) {
    normalized = normalize_domain_string(domain)
    where(domain: [ normalized, "www.#{normalized}" ])
  }

  def self.normalize_domain_string(domain)
    domain.to_s.strip.downcase.sub(/^www\./, "")
  end
  scope :for_field, ->(field) { where(field_name: field) }
  scope :discovered, -> { where(discovery_method: "discovered") }
  scope :heuristic, -> { where(discovery_method: "heuristic") }
  # Note: confidence is calculated in Ruby, so we filter in memory after loading
  scope :with_minimum_samples, ->(min = 3) { where("success_count >= ?", min) }

  # Wilson score interval (lower bound) - handles small sample sizes well
  # Returns a value between 0 and 1
  def confidence
    return 0.0 if total_samples.zero?

    z = 1.96 # 95% confidence
    n = total_samples.to_f
    p_hat = success_count.to_f / n

    numerator = p_hat + (z * z) / (2 * n) - z * Math.sqrt((p_hat * (1 - p_hat) + (z * z) / (4 * n)) / n)
    denominator = 1 + (z * z) / n

    (numerator / denominator).round(4)
  end

  def total_samples
    success_count + failure_count
  end

  def record_success!
    increment!(:success_count)
    touch(:last_seen_at)
  end

  def record_failure!
    increment!(:failure_count)
    touch(:last_seen_at)
  end

  # Find or create selector and record success
  def self.record_success(domain:, field_name:, selector:, discovery_method: "heuristic", discovery_score: nil)
    normalized_domain = normalize_domain_string(domain)
    record = find_or_initialize_by(domain: normalized_domain, field_name: field_name, selector: selector)

    # If this is a new discovered selector, set the discovery attributes
    if record.new_record?
      record.discovery_method = discovery_method
      record.discovery_score = discovery_score
    elsif discovery_method == "discovered" && record.discovery_method == "heuristic"
      # Upgrade from heuristic to discovered if we now have evidence it's correct
      record.discovery_method = "discovered"
      record.discovery_score = discovery_score if discovery_score
    end

    record.save!
    record.record_success!
    record
  end

  # Find or create selector and record failure
  def self.record_failure(domain:, field_name:, selector:, discovery_method: "heuristic", discovery_score: nil)
    normalized_domain = normalize_domain_string(domain)
    record = find_or_initialize_by(domain: normalized_domain, field_name: field_name, selector: selector)

    if record.new_record?
      record.discovery_method = discovery_method
      record.discovery_score = discovery_score
    end

    record.save!
    record.record_failure!
    record
  end

  # Record a discovered selector (from user correction + DOM search)
  def self.record_discovered(domain:, field_name:, selector:, score:)
    normalized_domain = normalize_domain_string(domain)
    record = find_or_initialize_by(domain: normalized_domain, field_name: field_name, selector: selector)

    record.discovery_method = "discovered"
    record.discovery_score = score

    # Discovered selectors start with 1 success (the correction that discovered them)
    if record.new_record?
      record.success_count = 1
      record.last_seen_at = Time.current
    else
      record.increment(:success_count)
      record.last_seen_at = Time.current
    end

    record.save!
    record
  end

  # Get best selectors for a domain, ordered by confidence
  # Discovered selectors are prioritized over heuristic ones
  # Returns hash: { "name" => "h1.product-title", "price" => ".price-value" }
  def self.best_for_domain(domain, min_samples: 2, min_confidence: 0.5)
    results = {}

    TRACKABLE_FIELDS.each do |field|
      # Load all candidates for this domain/field
      all_candidates = for_domain(domain).for_field(field).to_a

      # First priority: discovered selectors with good confidence
      discovered_candidates = all_candidates
        .select { |ds| ds.discovery_method == "discovered" }
        .select { |ds| ds.total_samples >= 1 && ds.confidence >= 0.4 }

      best = discovered_candidates.max_by { |ds| [ ds.confidence, ds.discovery_score || 0 ] }

      # Second priority: any selector with enough samples and high confidence
      if best.nil?
        reliable_candidates = all_candidates
          .select { |ds| ds.total_samples >= min_samples && ds.confidence >= min_confidence }

        best = reliable_candidates.max_by(&:confidence)
      end

      results[field] = best.selector if best
    end

    results
  end

  # Get all selectors for a domain with their scores (for debugging/admin)
  def self.all_for_domain(domain)
    for_domain(domain)
      .order(:field_name, success_count: :desc)
      .map do |ds|
        {
          field: ds.field_name,
          selector: ds.selector,
          success: ds.success_count,
          failure: ds.failure_count,
          confidence: ds.confidence,
          last_seen: ds.last_seen_at
        }
      end
  end

  private

  def normalize_domain
    self.domain = self.class.normalize_domain_string(domain) if domain.present?
  end
end
