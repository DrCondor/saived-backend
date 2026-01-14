require "test_helper"

class Api::V1::CategoriesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    get api_v1_categories_path, params: { domain: "example.com" }
    assert_response :unauthorized
  end

  # ============================================================
  # INDEX - BASIC
  # ============================================================

  test "returns categories for domain" do
    create(:domain_category, domain: "ikea.pl", category_value: "meble",
           success_count: 10, failure_count: 1)
    create(:domain_category, domain: "ikea.pl", category_value: "tkaniny",
           success_count: 15, failure_count: 2)

    get api_v1_categories_path,
        params: { domain: "ikea.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
    assert json_response["categories"].any? { |c| c["category"] == "meble" }
  end

  test "returns top_category for domain" do
    create(:domain_category, domain: "ikea.pl", category_value: "meble",
           success_count: 20, failure_count: 1)

    get api_v1_categories_path,
        params: { domain: "ikea.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "meble", json_response["top_category"]["category"]
    assert json_response["top_category"]["confidence"].present?
    assert json_response["top_category"]["samples"].present?
  end

  test "returns nil top_category for unknown domain" do
    get api_v1_categories_path,
        params: { domain: "unknown-shop.com" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "unknown-shop.com", json_response["domain"]
    assert_nil json_response["top_category"]
    assert_empty json_response["categories"]
  end

  test "returns 400 when domain is missing" do
    get api_v1_categories_path, headers: auth_headers(@user)

    assert_response :bad_request
    assert_equal "domain parameter required", json_response["error"]
  end

  # ============================================================
  # DOMAIN NORMALIZATION
  # ============================================================

  test "normalizes www prefix" do
    create(:domain_category, domain: "ikea.pl", category_value: "meble",
           success_count: 10, failure_count: 0)

    get api_v1_categories_path,
        params: { domain: "www.ikea.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
  end

  test "normalizes uppercase domain" do
    create(:domain_category, domain: "ikea.pl", category_value: "meble",
           success_count: 10, failure_count: 0)

    get api_v1_categories_path,
        params: { domain: "IKEA.PL" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "ikea.pl", json_response["domain"]
  end

  # ============================================================
  # STATS
  # ============================================================

  test "includes stats in response" do
    create(:domain_category, domain: "shop.pl", category_value: "meble",
           success_count: 10, failure_count: 1)
    create(:domain_category, domain: "shop.pl", category_value: "tkaniny",
           success_count: 5, failure_count: 0)

    get api_v1_categories_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    stats = json_response["stats"]
    assert_equal 2, stats["total_records"]
    assert_equal 16, stats["total_samples"]
  end

  # ============================================================
  # CATEGORY RANKING
  # ============================================================

  test "returns categories sorted by confidence" do
    # Low confidence category
    create(:domain_category, domain: "shop.pl", category_value: "tkaniny",
           success_count: 3, failure_count: 7)
    # High confidence category
    create(:domain_category, domain: "shop.pl", category_value: "meble",
           success_count: 20, failure_count: 2)

    get api_v1_categories_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    assert_equal "meble", json_response["top_category"]["category"]
  end

  test "does not return categories below minimum samples" do
    create(:domain_category, domain: "shop.pl", category_value: "meble",
           success_count: 1, failure_count: 0)

    get api_v1_categories_path,
        params: { domain: "shop.pl" },
        headers: auth_headers(@user)

    assert_response :success
    # With only 1 sample, shouldn't meet the minimum threshold
    assert_nil json_response["top_category"]
    assert_empty json_response["categories"]
  end
end
