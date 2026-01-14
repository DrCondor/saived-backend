require "test_helper"

class DomainCategoryTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "valid domain category" do
    dc = build(:domain_category, domain: "example.com", category_value: "meble")
    assert dc.valid?
  end

  test "requires domain" do
    dc = build(:domain_category, domain: nil)
    assert_not dc.valid?
    assert_includes dc.errors[:domain], "can't be blank"
  end

  test "requires category_value" do
    dc = build(:domain_category, category_value: nil)
    assert_not dc.valid?
    assert_includes dc.errors[:category_value], "can't be blank"
  end

  test "category_value must be unique per domain" do
    create(:domain_category, domain: "example.com", category_value: "meble")
    dc = build(:domain_category, domain: "example.com", category_value: "meble")
    assert_not dc.valid?
  end

  test "same category can exist for different domains" do
    create(:domain_category, domain: "example.com", category_value: "meble")
    dc = build(:domain_category, domain: "other.com", category_value: "meble")
    assert dc.valid?
  end

  # ============================================================
  # DOMAIN NORMALIZATION
  # ============================================================

  test "normalize_domain lowercases" do
    assert_equal "example.com", DomainCategory.normalize_domain("EXAMPLE.COM")
  end

  test "normalize_domain removes www prefix" do
    assert_equal "example.com", DomainCategory.normalize_domain("www.example.com")
  end

  test "normalize_domain strips whitespace" do
    assert_equal "example.com", DomainCategory.normalize_domain("  example.com  ")
  end

  # ============================================================
  # TOTAL SAMPLES
  # ============================================================

  test "total_samples sums success and failure counts" do
    dc = build(:domain_category, success_count: 5, failure_count: 3)
    assert_equal 8, dc.total_samples
  end

  test "total_samples is zero when no samples" do
    dc = build(:domain_category, success_count: 0, failure_count: 0)
    assert_equal 0, dc.total_samples
  end

  # ============================================================
  # CONFIDENCE CALCULATION (Wilson Score)
  # ============================================================

  test "confidence is 0 when no samples" do
    dc = build(:domain_category, success_count: 0, failure_count: 0)
    assert_equal 0, dc.confidence
  end

  test "confidence with only successes" do
    dc = build(:domain_category, success_count: 10, failure_count: 0)
    confidence = dc.confidence
    # With 10 successes and 0 failures, Wilson score should be high but not 1.0
    assert_operator confidence, :>, 0.7
    assert_operator confidence, :<, 1.0
  end

  test "confidence with only failures" do
    dc = build(:domain_category, success_count: 0, failure_count: 10)
    confidence = dc.confidence
    # With 0 successes and 10 failures, Wilson score should be very low
    assert_operator confidence, :<, 0.1
  end

  test "confidence with mixed results" do
    dc = build(:domain_category, success_count: 8, failure_count: 2)
    confidence = dc.confidence
    # 80% success rate, Wilson score is conservative
    assert_operator confidence, :>, 0.4
    assert_operator confidence, :<, 0.9
  end

  test "confidence increases with more samples at same success rate" do
    dc_small = build(:domain_category, success_count: 4, failure_count: 1)
    dc_large = build(:domain_category, success_count: 40, failure_count: 10)

    # Same 80% success rate, but larger sample should have higher Wilson score
    assert_operator dc_large.confidence, :>, dc_small.confidence
  end

  # ============================================================
  # RECORD_RESULT
  # ============================================================

  test "record_result creates new category on success" do
    assert_difference -> { DomainCategory.count }, 1 do
      DomainCategory.record_result(domain: "new.com", category: "meble", success: true)
    end

    dc = DomainCategory.find_by(domain: "new.com", category_value: "meble")
    assert_equal 1, dc.success_count
    assert_equal 0, dc.failure_count
    assert_not_nil dc.last_seen_at
  end

  test "record_result increments success count" do
    dc = create(:domain_category, domain: "example.com", category_value: "meble", success_count: 5)

    DomainCategory.record_result(domain: "example.com", category: "meble", success: true)

    dc.reload
    assert_equal 6, dc.success_count
  end

  test "record_result increments failure count" do
    dc = create(:domain_category, domain: "example.com", category_value: "meble", failure_count: 2)

    DomainCategory.record_result(domain: "example.com", category: "meble", success: false)

    dc.reload
    assert_equal 3, dc.failure_count
  end

  test "record_result ignores invalid categories" do
    assert_no_difference -> { DomainCategory.count } do
      DomainCategory.record_result(domain: "example.com", category: "invalid_category", success: true)
    end
  end

  test "record_result normalizes domain" do
    DomainCategory.record_result(domain: "WWW.EXAMPLE.COM", category: "meble", success: true)

    dc = DomainCategory.find_by(category_value: "meble")
    assert_equal "example.com", dc.domain
  end

  # ============================================================
  # BEST_FOR_DOMAIN
  # ============================================================

  test "best_for_domain returns categories sorted by confidence" do
    create(:domain_category, domain: "example.com", category_value: "meble", success_count: 10, failure_count: 0)
    create(:domain_category, domain: "example.com", category_value: "tkaniny", success_count: 5, failure_count: 5)

    results = DomainCategory.best_for_domain("example.com")

    assert_equal 1, results.length # tkaniny doesn't meet min_confidence
    assert_equal "meble", results.first.category_value
  end

  test "best_for_domain filters by min_samples" do
    create(:domain_category, domain: "example.com", category_value: "meble", success_count: 1, failure_count: 0)

    results = DomainCategory.best_for_domain("example.com", min_samples: 2)

    assert_empty results
  end

  test "best_for_domain filters by min_confidence" do
    create(:domain_category, domain: "example.com", category_value: "meble", success_count: 3, failure_count: 7)

    results = DomainCategory.best_for_domain("example.com", min_confidence: 0.5)

    assert_empty results
  end

  # ============================================================
  # TOP_CATEGORY_FOR_DOMAIN
  # ============================================================

  test "top_category_for_domain returns best category info" do
    create(:domain_category, domain: "example.com", category_value: "meble", success_count: 10, failure_count: 1)

    result = DomainCategory.top_category_for_domain("example.com")

    assert_not_nil result
    assert_equal "meble", result[:category]
    assert_operator result[:confidence], :>, 0
    assert_equal 11, result[:samples]
  end

  test "top_category_for_domain returns nil when no reliable categories" do
    result = DomainCategory.top_category_for_domain("nonexistent.com")
    assert_nil result
  end

  # ============================================================
  # SCOPES
  # ============================================================

  test "for_domain scope filters by normalized domain" do
    create(:domain_category, domain: "example.com", category_value: "meble")
    create(:domain_category, domain: "other.com", category_value: "tkaniny")

    results = DomainCategory.for_domain("www.example.com")

    assert_equal 1, results.count
    assert_equal "meble", results.first.category_value
  end

  test "reliable scope filters by success_count" do
    create(:domain_category, success_count: 1)
    create(:domain_category, success_count: 5)

    results = DomainCategory.reliable

    assert_equal 1, results.count
  end

  # ============================================================
  # VALID CATEGORIES
  # ============================================================

  test "VALID_CATEGORIES includes all expected values" do
    expected = %w[meble tkaniny dekoracje armatura_i_ceramika oswietlenie okladziny_scienne agd]
    assert_equal expected.sort, DomainCategory::VALID_CATEGORIES.sort
  end
end
