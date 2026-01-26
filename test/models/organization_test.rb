require "test_helper"

class OrganizationTest < ActiveSupport::TestCase
  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "has_one user association" do
    org = create(:organization)
    user = create(:user, organization: org)

    assert_equal user, org.user
  end

  test "has_one_attached logo" do
    org = create(:organization, :with_logo)

    assert org.logo.attached?
    assert_equal "company_logo.png", org.logo.filename.to_s
  end

  test "logo is optional" do
    org = create(:organization)

    assert_not org.logo.attached?
    assert org.valid?
  end

  # ============================================================
  # ATTRIBUTES
  # ============================================================

  test "name is optional" do
    org = create(:organization, name: nil)
    assert org.valid?
  end

  test "nip is optional" do
    org = create(:organization, nip: nil)
    assert org.valid?
  end

  test "phone is optional" do
    org = create(:organization, phone: nil)
    assert org.valid?
  end

  test "company_info stores HTML content" do
    org = create(:organization, company_info: "<b>Bold</b> <i>Italic</i>")

    assert_equal "<b>Bold</b> <i>Italic</i>", org.company_info
  end

  # ============================================================
  # RANSACK
  # ============================================================

  test "ransackable_attributes returns expected fields" do
    expected = %w[id name nip phone created_at updated_at]
    assert_equal expected, Organization.ransackable_attributes
  end

  test "ransackable_associations returns expected associations" do
    expected = %w[user logo_attachment logo_blob]
    assert_equal expected, Organization.ransackable_associations
  end

  # ============================================================
  # FACTORY
  # ============================================================

  test "factory creates valid organization" do
    org = build(:organization)
    assert org.valid?
  end

  test "factory with_full_details trait creates organization with all fields" do
    org = create(:organization, :with_full_details)

    assert_equal "123-456-78-90", org.nip
    assert_equal "+48 123 456 789", org.phone
    assert_equal "<b>Test Company Info</b>", org.company_info
  end
end
