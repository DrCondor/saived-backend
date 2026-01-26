require "test_helper"

class Api::V1::FavoritesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user)
    @project = create(:project, owner: @user)
    @project.project_memberships.create!(user: @user, role: "owner")
    @section = @project.sections.first
    @item = create(:project_item, project_section: @section, name: "Test Item")
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "GET /favorites returns 401 without auth" do
    get api_v1_favorites_path
    assert_response :unauthorized
  end

  test "POST /favorites/:id returns 401 without auth" do
    post "/api/v1/favorites/#{@item.id}"
    assert_response :unauthorized
  end

  test "DELETE /favorites/:id returns 401 without auth" do
    delete "/api/v1/favorites/#{@item.id}"
    assert_response :unauthorized
  end

  # ============================================================
  # INDEX
  # ============================================================

  test "index returns empty array when no favorites" do
    get api_v1_favorites_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal [], json_response
  end

  test "index returns favorited items" do
    create(:item_favorite, user: @user, project_item: @item)

    get api_v1_favorites_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal 1, json_response.length
    assert_equal @item.id, json_response[0]["id"]
    assert_equal @item.name, json_response[0]["name"]
    assert_equal @project.id, json_response[0]["project_id"]
    assert_equal @project.name, json_response[0]["project_name"]
    assert_equal @section.name, json_response[0]["section_name"]
  end

  test "index does not return other users favorites" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)
    other_project.project_memberships.create!(user: other_user, role: "owner")
    other_item = create(:project_item, project_section: other_project.sections.first)
    create(:item_favorite, user: other_user, project_item: other_item)

    get api_v1_favorites_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal [], json_response
  end

  # ============================================================
  # CREATE
  # ============================================================

  test "create adds item to favorites" do
    assert_difference -> { @user.item_favorites.count }, 1 do
      post "/api/v1/favorites/#{@item.id}", headers: auth_headers(@user)
    end

    assert_response :success
    assert_equal @item.id, json_response["id"]
    assert_equal true, json_response["favorite"]
  end

  test "create is idempotent - adding same item twice doesnt create duplicate" do
    create(:item_favorite, user: @user, project_item: @item)

    assert_no_difference -> { @user.item_favorites.count } do
      post "/api/v1/favorites/#{@item.id}", headers: auth_headers(@user)
    end

    assert_response :success
  end

  test "create returns 404 when item not found" do
    post "/api/v1/favorites/999999", headers: auth_headers(@user)

    assert_response :not_found
    assert_equal "Not found", json_response["error"]
  end

  test "create returns 404 when item belongs to other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)
    other_project.project_memberships.create!(user: other_user, role: "owner")
    other_item = create(:project_item, project_section: other_project.sections.first)

    post "/api/v1/favorites/#{other_item.id}", headers: auth_headers(@user)

    assert_response :not_found
  end

  # ============================================================
  # DESTROY
  # ============================================================

  test "destroy removes item from favorites" do
    create(:item_favorite, user: @user, project_item: @item)

    assert_difference -> { @user.item_favorites.count }, -1 do
      delete "/api/v1/favorites/#{@item.id}", headers: auth_headers(@user)
    end

    assert_response :success
    assert_equal @item.id, json_response["id"]
    assert_equal false, json_response["favorite"]
  end

  test "destroy is idempotent - removing non-favorited item returns success" do
    delete "/api/v1/favorites/#{@item.id}", headers: auth_headers(@user)

    assert_response :success
    assert_equal false, json_response["favorite"]
  end

  test "destroy returns 404 when item not found" do
    delete "/api/v1/favorites/999999", headers: auth_headers(@user)

    assert_response :not_found
  end

  test "destroy returns 404 when item belongs to other users project" do
    other_user = create(:user)
    other_project = create(:project, owner: other_user)
    other_project.project_memberships.create!(user: other_user, role: "owner")
    other_item = create(:project_item, project_section: other_project.sections.first)

    delete "/api/v1/favorites/#{other_item.id}", headers: auth_headers(@user)

    assert_response :not_found
  end
end
