require "test_helper"

class DomainSelectorTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "valid domain selector" do
    ds = build(:domain_selector, domain: "example.com", field_name: "name", selector: "h1")
    assert ds.valid?
  end

  test "requires domain" do
    ds = build(:domain_selector, domain: nil)
    assert_not ds.valid?
    assert_includes ds.errors[:domain], "can't be blank"
  end

  test "requires field_name" do
    ds = build(:domain_selector, field_name: nil)
    assert_not ds.valid?
    assert_includes ds.errors[:field_name], "can't be blank"
  end

  test "requires selector" do
    ds = build(:domain_selector, selector: nil)
    assert_not ds.valid?
    assert_includes ds.errors[:selector], "can't be blank"
  end

  test "field_name must be in TRACKABLE_FIELDS" do
    ds = build(:domain_selector, field_name: "invalid")
    assert_not ds.valid?
    assert_includes ds.errors[:field_name], "is not included in the list"
  end

  test "discovery_method must be valid" do
    ds = build(:domain_selector, discovery_method: "invalid")
    assert_not ds.valid?
  end

  test "selector must be unique per domain and field" do
    create(:domain_selector, domain: "example.com", field_name: "name", selector: "h1")
    ds = build(:domain_selector, domain: "example.com", field_name: "name", selector: "h1")
    assert_not ds.valid?
  end

  # ============================================================
  # DOMAIN NORMALIZATION
  # ============================================================

  test "normalizes domain to lowercase" do
    ds = create(:domain_selector, domain: "EXAMPLE.COM", field_name: "name", selector: "h1")
    assert_equal "example.com", ds.domain
  end

  test "removes www prefix from domain" do
    ds = create(:domain_selector, domain: "www.example.com", field_name: "name", selector: "h1")
    assert_equal "example.com", ds.domain
  end

  test "strips whitespace from domain" do
    ds = create(:domain_selector, domain: "  example.com  ", field_name: "name", selector: "h1")
    assert_equal "example.com", ds.domain
  end

  # ============================================================
  # CONFIDENCE CALCULATION (Wilson Score)
  # ============================================================

  test "confidence is 0 when no samples" do
    ds = build(:domain_selector, success_count: 0, failure_count: 0)
    assert_equal 0.0, ds.confidence
  end

  test "confidence with only successes" do
    ds = build(:domain_selector, success_count: 10, failure_count: 0)
    confidence = ds.confidence
    # With 10 successes and 0 failures, Wilson score should be high but not 1.0
    assert_operator confidence, :>, 0.7
    assert_operator confidence, :<, 1.0
  end

  test "confidence with only failures" do
    ds = build(:domain_selector, success_count: 0, failure_count: 10)
    confidence = ds.confidence
    # With 0 successes and 10 failures, Wilson score should be very low
    assert_operator confidence, :<, 0.1
  end

  test "confidence with mixed results" do
    ds = build(:domain_selector, success_count: 8, failure_count: 2)
    confidence = ds.confidence
    # 80% success rate, Wilson score is conservative due to small sample
    # With n=10, 80% gives Wilson lower bound ~0.49
    assert_operator confidence, :>, 0.4
    assert_operator confidence, :<, 0.9
  end

  test "confidence increases with more samples at same success rate" do
    ds_small = build(:domain_selector, success_count: 4, failure_count: 1) # 80%, n=5
    ds_large = build(:domain_selector, success_count: 40, failure_count: 10) # 80%, n=50

    # More samples = higher confidence (narrower interval)
    assert_operator ds_large.confidence, :>, ds_small.confidence
  end

  test "total_samples returns sum of success and failure" do
    ds = build(:domain_selector, success_count: 5, failure_count: 3)
    assert_equal 8, ds.total_samples
  end

  # ============================================================
  # RECORD SUCCESS/FAILURE
  # ============================================================

  test "record_success! increments success_count" do
    ds = create(:domain_selector, success_count: 5)
    ds.record_success!
    assert_equal 6, ds.reload.success_count
  end

  test "record_success! updates last_seen_at" do
    ds = create(:domain_selector, last_seen_at: nil)
    freeze_time do
      ds.record_success!
      assert_equal Time.current, ds.reload.last_seen_at
    end
  end

  test "record_failure! increments failure_count" do
    ds = create(:domain_selector, failure_count: 3)
    ds.record_failure!
    assert_equal 4, ds.reload.failure_count
  end

  # ============================================================
  # CLASS METHODS: RECORD SUCCESS/FAILURE/DISCOVERED
  # ============================================================

  test "record_success creates new selector if not exists" do
    assert_difference "DomainSelector.count", 1 do
      DomainSelector.record_success(
        domain: "newsite.com",
        field_name: "name",
        selector: "h1.title"
      )
    end

    ds = DomainSelector.last
    assert_equal "newsite.com", ds.domain
    assert_equal 1, ds.success_count
  end

  test "record_success increments existing selector" do
    existing = create(:domain_selector, domain: "example.com", field_name: "name", selector: "h1", success_count: 5)

    assert_no_difference "DomainSelector.count" do
      DomainSelector.record_success(
        domain: "example.com",
        field_name: "name",
        selector: "h1"
      )
    end

    assert_equal 6, existing.reload.success_count
  end

  test "record_failure creates new selector if not exists" do
    assert_difference "DomainSelector.count", 1 do
      DomainSelector.record_failure(
        domain: "newsite.com",
        field_name: "price",
        selector: ".price"
      )
    end

    ds = DomainSelector.last
    assert_equal 1, ds.failure_count
    assert_equal 0, ds.success_count
  end

  test "record_discovered creates selector with discovery attributes" do
    ds = DomainSelector.record_discovered(
      domain: "shop.com",
      field_name: "name",
      selector: "h1.product-name",
      score: 85
    )

    assert_equal "discovered", ds.discovery_method
    assert_equal 85, ds.discovery_score
    assert_equal 1, ds.success_count
  end

  # ============================================================
  # SCOPES
  # ============================================================

  test "for_domain finds by normalized domain" do
    create(:domain_selector, domain: "example.com", field_name: "name", selector: "h1")

    assert_equal 1, DomainSelector.for_domain("example.com").count
    assert_equal 1, DomainSelector.for_domain("EXAMPLE.COM").count
    assert_equal 1, DomainSelector.for_domain("www.example.com").count
  end

  test "for_field filters by field_name" do
    create(:domain_selector, domain: "example.com", field_name: "name", selector: "h1")
    create(:domain_selector, domain: "example.com", field_name: "price", selector: ".price")

    assert_equal 1, DomainSelector.for_field("name").count
    assert_equal 1, DomainSelector.for_field("price").count
  end

  # ============================================================
  # BEST FOR DOMAIN
  # ============================================================

  test "best_for_domain returns best selector per field" do
    # Create selectors with different confidence levels
    create(:domain_selector, domain: "shop.pl", field_name: "name", selector: "h1.bad", success_count: 2, failure_count: 8)
    create(:domain_selector, domain: "shop.pl", field_name: "name", selector: "h1.good", success_count: 10, failure_count: 1)
    # Need higher success rate for price to meet 0.5 confidence threshold
    create(:domain_selector, domain: "shop.pl", field_name: "price", selector: ".price", success_count: 15, failure_count: 2)

    results = DomainSelector.best_for_domain("shop.pl")

    assert_equal "h1.good", results["name"]
    assert_equal ".price", results["price"]
    assert_nil results["thumbnail_url"] # No selector with enough samples
  end

  test "best_for_domain prioritizes discovered selectors" do
    # Heuristic selector with high confidence
    create(:domain_selector, domain: "shop.pl", field_name: "name", selector: "h1.heuristic",
           success_count: 20, failure_count: 2, discovery_method: "heuristic")

    # Discovered selector with lower confidence but should be prioritized
    create(:domain_selector, domain: "shop.pl", field_name: "name", selector: "h1.discovered",
           success_count: 5, failure_count: 1, discovery_method: "discovered", discovery_score: 90)

    results = DomainSelector.best_for_domain("shop.pl")

    assert_equal "h1.discovered", results["name"]
  end

  test "best_for_domain returns empty hash when no reliable selectors" do
    create(:domain_selector, domain: "shop.pl", field_name: "name", selector: "h1", success_count: 1, failure_count: 0)

    results = DomainSelector.best_for_domain("shop.pl", min_samples: 3)

    assert_empty results
  end
end
