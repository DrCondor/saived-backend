require "test_helper"

class UserTest < ActiveSupport::TestCase
  # ============================================================
  # VALIDATIONS (Devise)
  # ============================================================

  test "valid user" do
    user = build(:user)
    assert user.valid?
  end

  test "requires email" do
    user = build(:user, email: nil)
    assert_not user.valid?
  end

  test "requires unique email" do
    create(:user, email: "test@example.com")
    user = build(:user, email: "test@example.com")
    assert_not user.valid?
  end

  test "requires valid email format" do
    user = build(:user, email: "invalid")
    assert_not user.valid?
  end

  test "requires password" do
    user = build(:user, password: nil)
    assert_not user.valid?
  end

  test "requires password minimum length" do
    user = build(:user, password: "12345")
    assert_not user.valid?
  end

  # ============================================================
  # API TOKEN
  # ============================================================

  test "generates api_token on create" do
    user = create(:user)
    assert_not_nil user.api_token
    assert_equal 24, user.api_token.length
  end

  test "api_token is unique per user" do
    user1 = create(:user)
    user2 = create(:user)
    assert_not_equal user1.api_token, user2.api_token
  end

  # ============================================================
  # PROFILE HELPERS
  # ============================================================

  test "full_name returns first and last name" do
    user = build(:user, first_name: "Jan", last_name: "Kowalski")
    assert_equal "Jan Kowalski", user.full_name
  end

  test "full_name returns only first name when last is blank" do
    user = build(:user, first_name: "Jan", last_name: nil)
    assert_equal "Jan", user.full_name
  end

  test "full_name returns only last name when first is blank" do
    user = build(:user, first_name: nil, last_name: "Kowalski")
    assert_equal "Kowalski", user.full_name
  end

  test "full_name returns nil when both are blank" do
    user = build(:user, first_name: nil, last_name: nil)
    assert_nil user.full_name
  end

  test "full_name handles empty strings" do
    user = build(:user, first_name: "", last_name: "")
    assert_nil user.full_name
  end

  test "display_name returns full name when available" do
    user = build(:user, first_name: "Jan", last_name: "Kowalski", email: "jan@example.com")
    assert_equal "Jan Kowalski", user.display_name
  end

  test "display_name returns email prefix when no name" do
    user = build(:user, first_name: nil, last_name: nil, email: "designer@example.com")
    assert_equal "designer", user.display_name
  end

  test "initials returns first letters of name" do
    user = build(:user, first_name: "Jan", last_name: "Kowalski")
    assert_equal "JK", user.initials
  end

  test "initials uses first two letters of first name when no last name" do
    user = build(:user, first_name: "Jan", last_name: nil)
    assert_equal "JA", user.initials
  end

  test "initials uses email when no name" do
    user = build(:user, first_name: nil, last_name: nil, email: "test@example.com")
    assert_equal "TE", user.initials
  end

  test "initials are uppercase" do
    user = build(:user, first_name: "jan", last_name: "kowalski")
    assert_equal "JK", user.initials
  end

  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "has many owned_projects" do
    user = create(:user)
    project = create(:project, owner: user)
    assert_includes user.owned_projects, project
  end

  test "owned_projects are destroyed when user is destroyed" do
    user = create(:user)
    project = create(:project, owner: user)
    user.destroy
    assert_nil Project.find_by(id: project.id)
  end

  test "has many project_memberships" do
    user = create(:user)
    project = create(:project)
    project.project_memberships.create!(user: user, role: "editor")
    assert_equal 1, user.project_memberships.count
  end

  test "has many projects through memberships" do
    user = create(:user)
    project = create(:project)
    project.project_memberships.create!(user: user, role: "viewer")
    assert_includes user.projects, project
  end

  test "has many product_capture_samples" do
    user = create(:user)
    sample = create(:product_capture_sample, user: user)
    assert_includes user.product_capture_samples, sample
  end

  # NOTE: user_id has NOT NULL constraint in DB, so dependent: :nullify
  # in User model won't work. This is a known issue to be fixed later.
end
