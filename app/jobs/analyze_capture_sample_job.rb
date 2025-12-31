class AnalyzeCaptureSampleJob < ApplicationJob
  queue_as :default

  # Field mapping: { final_payload_key => context_selectors_key }
  FIELD_MAPPING = {
    "name" => "name",
    "unit_price_cents" => "price",      # raw has unit_price, final has unit_price_cents
    "thumbnail_url" => "thumbnail"
  }.freeze

  def perform(sample_id)
    sample = ProductCaptureSample.find_by(id: sample_id)
    return unless sample

    domain = sample.domain
    return if domain.blank?

    context = sample.context || {}
    selectors = context["selectors"] || {}
    discovered_selectors = context["discovered_selectors"] || {}
    raw = sample.raw_payload || {}
    final = sample.final_payload || {}

    # Process discovered selectors first (from user corrections)
    process_discovered_selectors(domain, discovered_selectors)

    # Then analyze heuristic selectors
    analyze_field(domain, "name", raw, final, selectors)
    analyze_field(domain, "unit_price_cents", raw, final, selectors, :price)
    analyze_field(domain, "thumbnail_url", raw, final, selectors)
  end

  private

  # Process selectors discovered from user corrections (high value!)
  def process_discovered_selectors(domain, discovered_selectors)
    return if discovered_selectors.blank?

    discovered_selectors.each do |field_key, discovery_data|
      next unless discovery_data.is_a?(Hash)

      candidates = discovery_data["candidates"]
      next unless candidates.is_a?(Array) && candidates.any?

      # Map field keys to DomainSelector field names
      field_name = case field_key.to_s
      when "price" then "price"
      when "name" then "name"
      when "thumbnail_url", "thumbnail" then "thumbnail_url"
      else next
      end

      # Record the best discovered selector
      best_candidate = candidates.first
      selector = best_candidate["selector"]
      score = best_candidate["score"] || 0

      next if selector.blank?

      Rails.logger.info("[Learning] DISCOVERED: #{domain} / #{field_name} / #{selector} (score: #{score})")

      DomainSelector.record_discovered(
        domain: domain,
        field_name: field_name,
        selector: selector,
        score: score
      )
    end
  end

  def analyze_field(domain, final_key, raw, final, selectors, selector_key = nil)
    selector_key ||= FIELD_MAPPING[final_key] || final_key
    selector = selectors[selector_key.to_s]

    # No selector recorded = nothing to learn
    return unless selector.present?

    # Determine the raw key (extension uses different names)
    raw_key = case final_key
    when "unit_price_cents" then "unit_price"
    else final_key
    end

    raw_value = raw[raw_key] || raw[raw_key.to_sym]
    final_value = final[final_key] || final[final_key.to_sym]

    # Convert unit_price_cents to unit_price for comparison
    if final_key == "unit_price_cents" && final_value.present?
      final_value = final_value.to_f / 100.0
    end

    # Map selector_key to DomainSelector field_name
    field_name = case selector_key.to_s
    when "price" then "price"
    when "thumbnail" then "thumbnail_url"
    else "name"
    end

    if values_match?(raw_value, final_value, field_name)
      DomainSelector.record_success(
        domain: domain,
        field_name: field_name,
        selector: selector
      )
      Rails.logger.info("[Learning] SUCCESS: #{domain} / #{field_name} / #{selector}")
    else
      DomainSelector.record_failure(
        domain: domain,
        field_name: field_name,
        selector: selector
      )
      Rails.logger.info("[Learning] FAILURE: #{domain} / #{field_name} / #{selector} (raw: #{raw_value.inspect}, final: #{final_value.inspect})")
    end
  end

  def values_match?(raw, final, field_name)
    # Both nil/empty = no data, not a match
    return false if raw.blank? && final.blank?

    # One present, other missing = failure
    return false if raw.blank? || final.blank?

    case field_name
    when "name"
      normalize_string(raw) == normalize_string(final)
    when "price"
      # Allow small tolerance for price (0.01)
      (raw.to_f - final.to_f).abs < 0.02
    when "thumbnail_url"
      # URLs should match exactly (after normalization)
      normalize_url(raw) == normalize_url(final)
    else
      raw.to_s == final.to_s
    end
  end

  def normalize_string(str)
    return "" if str.blank?
    str.to_s.strip.downcase.gsub(/\s+/, " ")
  end

  def normalize_url(url)
    return "" if url.blank?
    url.to_s.strip.downcase.gsub(/\?.*$/, "") # Remove query params for comparison
  end
end
