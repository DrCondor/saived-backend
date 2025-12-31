require "test_helper"

class Api::V1::SelectorsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    get api_v1_selectors_path, params: { domain: "example.com" }
    assert_response :unauthorized
  end

  # ============================================================
  # INDEX - BASIC
  # ============================================================

  test "returns selectors for domain" do
    create(:domain_selector, domain: "ikea.pl", field_name: "name",
           selector: "h1.product-title", success_count: 10, failure_count: 1)
    create(:domain_selector, domain: "ikea.pl", field_name: "price",
           selector: ".price-box", success_count: 15, failure_count: 2)

    get api_v1_selectors_path,
        params: { domain: "ikea.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
    assert_equal "h1.product-title", json_response["selectors"]["name"]
    assert_equal ".price-box", json_response["selectors"]["price"]
  end

  test "returns empty selectors for unknown domain" do
    get api_v1_selectors_path,
        params: { domain: "unknown-shop.com" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "unknown-shop.com", json_response["domain"]
    assert_empty json_response["selectors"]
  end

  test "returns 400 when domain is missing" do
    get api_v1_selectors_path, headers: auth_headers(@user)

    assert_response :bad_request
    assert_equal "Missing domain parameter", json_response["error"]
  end

  # ============================================================
  # DOMAIN NORMALIZATION
  # ============================================================

  test "normalizes www prefix" do
    create(:domain_selector, domain: "ikea.pl", field_name: "name",
           selector: "h1", success_count: 10, failure_count: 0)

    get api_v1_selectors_path,
        params: { domain: "www.ikea.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
    assert_equal "h1", json_response["selectors"]["name"]
  end

  test "normalizes uppercase domain" do
    create(:domain_selector, domain: "ikea.pl", field_name: "name",
           selector: "h1", success_count: 10, failure_count: 0)

    get api_v1_selectors_path,
        params: { domain: "IKEA.PL" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
  end

  # ============================================================
  # STATS
  # ============================================================

  test "includes stats in response" do
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1", success_count: 10, failure_count: 1,
           discovery_method: "discovered")
    create(:domain_selector, domain: "shop.pl", field_name: "price",
           selector: ".price", success_count: 5, failure_count: 0,
           discovery_method: "heuristic")

    get api_v1_selectors_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    stats = json_response["stats"]
    assert_equal 2, stats["total_selectors"]
    assert_equal 1, stats["discovered_count"]
    assert_equal 1, stats["heuristic_count"]
  end

  test "stats include field breakdown" do
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1", success_count: 10, failure_count: 2)

    get api_v1_selectors_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    fields = json_response["stats"]["fields"]

    name_field = fields.find { |f| f["field"] == "name" }
    assert_equal 1, name_field["selector_count"]
    assert_equal "h1", name_field["best_selector"]
    assert name_field["best_confidence"].present?
  end

  # ============================================================
  # SELECTOR SELECTION LOGIC
  # ============================================================

  test "returns best selector by confidence" do
    # Low confidence selector
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1.bad", success_count: 3, failure_count: 7)
    # High confidence selector
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1.good", success_count: 20, failure_count: 2)

    get api_v1_selectors_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "h1.good", json_response["selectors"]["name"]
  end

  test "prioritizes discovered over heuristic selectors" do
    # High confidence heuristic
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1.heuristic", success_count: 30, failure_count: 2,
           discovery_method: "heuristic")
    # Lower confidence but discovered
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1.discovered", success_count: 5, failure_count: 1,
           discovery_method: "discovered", discovery_score: 90)

    get api_v1_selectors_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "h1.discovered", json_response["selectors"]["name"]
  end

  test "does not return selectors below minimum samples" do
    create(:domain_selector, domain: "shop.pl", field_name: "name",
           selector: "h1", success_count: 1, failure_count: 0)

    get api_v1_selectors_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    # With only 1 sample, shouldn't meet the minimum threshold
    assert_nil json_response["selectors"]["name"]
  end
end
