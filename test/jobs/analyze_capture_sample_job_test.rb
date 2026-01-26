require "test_helper"

class AnalyzeCaptureSampleJobTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = @project.sections.first
    @item = create(:project_item, project_section: @section)
  end

  # ============================================================
  # BASIC FUNCTIONALITY
  # ============================================================

  test "records success when raw matches final" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "ikea.pl",
                    raw_payload: { name: "Chair", unit_price: 299.99, thumbnail_url: "https://example.com/img.jpg" },
                    final_payload: { name: "Chair", unit_price_cents: 29999, thumbnail_url: "https://example.com/img.jpg" },
                    context: { selectors: { name: "h1", price: ".price", thumbnail: "img.main" } })

    assert_difference -> { DomainSelector.count }, 3 do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end

    selector = DomainSelector.find_by(domain: "ikea.pl", field_name: "name")
    assert_equal 1, selector.success_count
    assert_equal 0, selector.failure_count
  end

  test "records failure when raw differs from final" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "ikea.pl",
                    raw_payload: { name: "Wrong Name" },
                    final_payload: { name: "Correct Name" },
                    context: { selectors: { name: "h1" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "ikea.pl", field_name: "name")
    assert_equal 0, selector.success_count
    assert_equal 1, selector.failure_count
  end

  test "handles non-existent sample gracefully" do
    assert_nothing_raised do
      AnalyzeCaptureSampleJob.perform_now(999999)
    end
  end

  test "handles sample with empty domain" do
    # Domain is required at DB level, but we can test with blank string
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "valid.pl")
    # Manually set domain to empty (bypass validation)
    sample.update_column(:domain, "")

    assert_no_difference -> { DomainSelector.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end

  # ============================================================
  # PRICE COMPARISON
  # ============================================================

  test "normalizes price comparison with cents conversion" do
    # final_payload uses unit_price_cents, raw_payload uses unit_price
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { unit_price: 299.99 },
                    final_payload: { unit_price_cents: 29999 },
                    context: { selectors: { price: ".price" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "price")
    assert_equal 1, selector.success_count
  end

  test "records price failure when values differ" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { unit_price: 199.99 },
                    final_payload: { unit_price_cents: 29999 },
                    context: { selectors: { price: ".price" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "price")
    assert_equal 0, selector.success_count
    assert_equal 1, selector.failure_count
  end

  test "allows small tolerance for price comparison" do
    # Within 0.02 tolerance
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { unit_price: 299.99 },
                    final_payload: { unit_price_cents: 30000 },  # 300.00, diff is 0.01
                    context: { selectors: { price: ".price" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "price")
    assert_equal 1, selector.success_count
  end

  # ============================================================
  # NAME COMPARISON
  # ============================================================

  test "normalizes name comparison - case insensitive" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { name: "IKEA CHAIR" },
                    final_payload: { name: "ikea chair" },
                    context: { selectors: { name: "h1" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "name")
    assert_equal 1, selector.success_count
  end

  test "normalizes name comparison - whitespace handling" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { name: "  Chair   Model  " },
                    final_payload: { name: "Chair Model" },
                    context: { selectors: { name: "h1" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "name")
    assert_equal 1, selector.success_count
  end

  # ============================================================
  # THUMBNAIL URL COMPARISON
  # ============================================================

  test "normalizes thumbnail URL - ignores query params" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { thumbnail_url: "https://example.com/img.jpg?size=large" },
                    final_payload: { thumbnail_url: "https://example.com/img.jpg" },
                    context: { selectors: { thumbnail: "img.main" } })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    selector = DomainSelector.find_by(domain: "test.pl", field_name: "thumbnail_url")
    assert_equal 1, selector.success_count
  end

  # ============================================================
  # DISCOVERED SELECTORS
  # ============================================================

  test "creates DomainSelector from discovered selectors" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "shop.pl",
                    context: {
                      selectors: {},
                      discovered_selectors: {
                        name: {
                          candidates: [
                            { selector: ".product-title", score: 85 }
                          ]
                        }
                      }
                    })

    assert_difference -> { DomainSelector.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end

    selector = DomainSelector.find_by(domain: "shop.pl", field_name: "name", selector: ".product-title")
    assert_not_nil selector
    assert_equal "discovered", selector.discovery_method
    assert_equal 85, selector.discovery_score
    assert_equal 1, selector.success_count
  end

  test "updates existing DomainSelector from discovered selectors" do
    existing = DomainSelector.create!(
      domain: "shop.pl",
      field_name: "name",
      selector: ".product-title",
      success_count: 2,
      discovery_method: "discovered",
      discovery_score: 80
    )

    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "shop.pl",
                    context: {
                      selectors: {},
                      discovered_selectors: {
                        name: {
                          candidates: [
                            { selector: ".product-title", score: 90 }
                          ]
                        }
                      }
                    })

    assert_no_difference -> { DomainSelector.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end

    existing.reload
    assert_equal 3, existing.success_count
    assert_equal 90, existing.discovery_score
  end

  # ============================================================
  # CATEGORY ANALYSIS
  # ============================================================

  test "records category success when suggestion matches final" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "furniture.pl",
                    context: { suggested_category: "meble" },
                    final_payload: { category: "meble" })

    assert_difference -> { DomainCategory.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end

    category = DomainCategory.find_by(domain: "furniture.pl", category_value: "meble")
    assert_equal 2, category.success_count  # 1 for suggestion match + 1 for confirmation
  end

  test "records category failure when suggestion differs from final" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "furniture.pl",
                    context: { suggested_category: "meble" },
                    final_payload: { category: "oswietlenie" })

    AnalyzeCaptureSampleJob.perform_now(sample.id)

    meble = DomainCategory.find_by(domain: "furniture.pl", category_value: "meble")
    assert_equal 0, meble.success_count
    assert_equal 1, meble.failure_count

    oswietlenie = DomainCategory.find_by(domain: "furniture.pl", category_value: "oswietlenie")
    assert_equal 1, oswietlenie.success_count
  end

  test "records final category even without suggestion" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "lighting.pl",
                    context: {},  # no suggested_category
                    final_payload: { category: "oswietlenie" })

    assert_difference -> { DomainCategory.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end

    category = DomainCategory.find_by(domain: "lighting.pl", category_value: "oswietlenie")
    assert_equal 1, category.success_count
  end

  test "skips category analysis without final category" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    context: { suggested_category: "meble" },
                    final_payload: {})

    assert_no_difference -> { DomainCategory.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end

  # ============================================================
  # EDGE CASES
  # ============================================================

  test "handles empty context" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    context: {})

    assert_nothing_raised do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end

  test "handles empty raw_payload" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: {},
                    context: { selectors: { name: "h1" } })

    assert_nothing_raised do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end

  test "handles empty final_payload" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    final_payload: {},
                    context: { selectors: { name: "h1" } })

    assert_nothing_raised do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end

  test "skips fields without selectors" do
    sample = create(:product_capture_sample,
                    user: @user,
                    project_item: @item,
                    domain: "test.pl",
                    raw_payload: { name: "Product" },
                    final_payload: { name: "Product" },
                    context: { selectors: {} })  # no selectors

    assert_no_difference -> { DomainSelector.count } do
      AnalyzeCaptureSampleJob.perform_now(sample.id)
    end
  end
end
