require "test_helper"

class ItemFavoriteTest < ActiveSupport::TestCase
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @item = create(:project_item, project_section: @project.sections.first)
  end

  # ============================================================
  # ASSOCIATIONS
  # ============================================================

  test "belongs_to user" do
    favorite = create(:item_favorite, user: @user, project_item: @item)

    assert_equal @user, favorite.user
  end

  test "belongs_to project_item" do
    favorite = create(:item_favorite, user: @user, project_item: @item)

    assert_equal @item, favorite.project_item
  end

  # ============================================================
  # VALIDATIONS
  # ============================================================

  test "validates uniqueness of user_id scoped to project_item_id" do
    create(:item_favorite, user: @user, project_item: @item)

    duplicate = build(:item_favorite, user: @user, project_item: @item)
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:user_id], "has already been taken"
  end

  test "allows same user to favorite different items" do
    item2 = create(:project_item, project_section: @project.sections.first, name: "Item 2")

    create(:item_favorite, user: @user, project_item: @item)
    favorite2 = build(:item_favorite, user: @user, project_item: item2)

    assert favorite2.valid?
  end

  test "allows different users to favorite same item" do
    user2 = create(:user)
    @project.project_memberships.create!(user: user2, role: "editor")

    create(:item_favorite, user: @user, project_item: @item)
    favorite2 = build(:item_favorite, user: user2, project_item: @item)

    assert favorite2.valid?
  end

  # ============================================================
  # CASCADE DELETE
  # ============================================================

  test "is deleted when user is deleted" do
    favorite = create(:item_favorite, user: @user, project_item: @item)
    favorite_id = favorite.id

    @user.destroy

    assert_not ItemFavorite.exists?(favorite_id)
  end

  test "is deleted when project_item is deleted" do
    favorite = create(:item_favorite, user: @user, project_item: @item)
    favorite_id = favorite.id

    @item.destroy

    assert_not ItemFavorite.exists?(favorite_id)
  end

  # ============================================================
  # FACTORY
  # ============================================================

  test "factory creates valid item_favorite" do
    favorite = build(:item_favorite)
    assert favorite.valid?
  end
end
