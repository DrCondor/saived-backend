class DomainCategory < ApplicationRecord
  validates :domain, presence: true
  validates :category_value, presence: true
  validates :domain, uniqueness: { scope: :category_value }

  VALID_CATEGORIES = %w[meble tkaniny dekoracje armatura_i_ceramika oswietlenie okladziny_scienne agd].freeze

  scope :for_domain, ->(domain) { where(domain: normalize_domain(domain)) }
  scope :reliable, -> { where("success_count >= ?", 2) }

  def self.normalize_domain(domain)
    domain.to_s.strip.downcase.sub(/^www\./, "")
  end

  def total_samples
    success_count + failure_count
  end

  def confidence
    return 0 if total_samples.zero?

    # Wilson score interval (95% confidence, lower bound)
    z = 1.96
    n = total_samples.to_f
    p_hat = success_count.to_f / n

    numerator = p_hat + (z * z) / (2 * n) - z * Math.sqrt((p_hat * (1 - p_hat) + (z * z) / (4 * n)) / n)
    denominator = 1 + (z * z) / n

    (numerator / denominator).round(4)
  end

  def self.record_result(domain:, category:, success:)
    return unless VALID_CATEGORIES.include?(category)

    normalized = normalize_domain(domain)
    record = find_or_initialize_by(domain: normalized, category_value: category)

    if success
      record.success_count += 1
    else
      record.failure_count += 1
    end
    record.last_seen_at = Time.current
    record.save
  end

  def self.best_for_domain(domain, min_samples: 2, min_confidence: 0.3)
    for_domain(domain)
      .where("success_count + failure_count >= ?", min_samples)
      .select { |dc| dc.confidence >= min_confidence }
      .sort_by { |dc| -dc.confidence }
  end

  def self.top_category_for_domain(domain)
    best = best_for_domain(domain).first
    return nil unless best

    {
      category: best.category_value,
      confidence: best.confidence,
      samples: best.total_samples
    }
  end
end
