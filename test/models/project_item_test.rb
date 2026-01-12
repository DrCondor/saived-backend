require "test_helper"

class ProjectItemTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "valid project item" do
    item = build(:project_item)
    assert item.valid?
  end

  test "requires name" do
    item = build(:project_item, name: nil)
    assert_not item.valid?
    assert_includes item.errors[:name], "can't be blank"
  end

  test "requires quantity greater than 0" do
    item = build(:project_item, quantity: 0)
    assert_not item.valid?
    assert_includes item.errors[:quantity], "must be greater than 0"
  end

  test "requires quantity to be positive" do
    item = build(:project_item, quantity: -1)
    assert_not item.valid?
  end

  test "requires status" do
    item = build(:project_item, status: nil)
    assert_not item.valid?
    assert_includes item.errors[:status], "can't be blank"
  end

  test "default status is bez_statusu" do
    item = ProjectItem.new
    assert_equal "bez_statusu", item.status
  end

  # ============================================================
  # PRICE HANDLING
  # ============================================================

  test "unit_price getter converts cents to decimal" do
    item = build(:project_item, unit_price_cents: 32999)
    assert_equal 329.99, item.unit_price
  end

  test "unit_price returns nil when cents is nil" do
    item = build(:project_item, unit_price_cents: nil)
    assert_nil item.unit_price
  end

  test "unit_price setter converts decimal to cents" do
    item = build(:project_item)
    item.unit_price = 329.99
    assert_equal 32999, item.unit_price_cents
  end

  test "unit_price setter handles string with dot" do
    item = build(:project_item)
    item.unit_price = "329.99"
    assert_equal 32999, item.unit_price_cents
  end

  test "unit_price setter handles string with comma (Polish format)" do
    item = build(:project_item)
    item.unit_price = "329,99"
    assert_equal 32999, item.unit_price_cents
  end

  test "unit_price setter handles blank value" do
    item = build(:project_item, unit_price_cents: 10000)
    item.unit_price = ""
    assert_nil item.unit_price_cents
  end

  test "unit_price setter handles nil" do
    item = build(:project_item, unit_price_cents: 10000)
    item.unit_price = nil
    assert_nil item.unit_price_cents
  end

  test "unit_price setter rounds correctly" do
    item = build(:project_item)
    item.unit_price = 99.999
    assert_equal 10000, item.unit_price_cents # Rounds to 100.00
  end

  # ============================================================
  # TOTAL PRICE
  # ============================================================

  test "total_price calculates correctly" do
    item = build(:project_item, unit_price_cents: 10000, quantity: 3)
    assert_equal 300.0, item.total_price
  end

  test "total_price returns nil when unit_price_cents is nil" do
    item = build(:project_item, unit_price_cents: nil, quantity: 3)
    assert_nil item.total_price
  end

  test "total_price returns nil when quantity is nil" do
    item = build(:project_item, unit_price_cents: 10000, quantity: nil)
    assert_nil item.total_price
  end

  test "total_price handles large quantities" do
    item = build(:project_item, unit_price_cents: 100000, quantity: 100)
    assert_equal 100000.0, item.total_price
  end

  # ============================================================
  # DISPLAY HELPERS
  # ============================================================

  test "formatted_unit_price returns dash when nil" do
    item = build(:project_item, unit_price_cents: nil)
    assert_equal "—", item.formatted_unit_price
  end

  test "formatted_unit_price includes currency" do
    item = build(:project_item, unit_price_cents: 32999, currency: "PLN")
    formatted = item.formatted_unit_price
    assert_includes formatted, "PLN"
    assert_includes formatted, "329"
  end

  test "formatted_total_price returns dash when nil" do
    item = build(:project_item, unit_price_cents: nil)
    assert_equal "—", item.formatted_total_price
  end

  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "belongs to project_section" do
    item = create(:project_item)
    assert_instance_of ProjectSection, item.project_section
  end

  test "project returns parent project" do
    item = create(:project_item)
    assert_instance_of Project, item.project
  end

  test "has many product_capture_samples" do
    item = create(:project_item)
    sample = create(:product_capture_sample, project_item: item)
    assert_includes item.product_capture_samples, sample
  end

  test "nullifies product_capture_samples on destroy" do
    item = create(:project_item)
    sample = create(:product_capture_sample, project_item: item)
    item.destroy
    assert_nil sample.reload.project_item_id
  end

  # ============================================================
  # THUMBNAIL
  # ============================================================

  test "thumbnail returns url when present" do
    item = build(:project_item, thumbnail_url: "https://example.com/image.jpg")
    assert_equal "https://example.com/image.jpg", item.thumbnail
  end

  test "thumbnail returns nil when blank" do
    item = build(:project_item, thumbnail_url: "")
    assert_nil item.thumbnail
  end

  test "thumbnail returns nil when nil" do
    item = build(:project_item, thumbnail_url: nil)
    assert_nil item.thumbnail
  end
end
