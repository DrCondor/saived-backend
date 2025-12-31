require "test_helper"

class Api::V1::UsersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = create(:user,
                   first_name: "Jan",
                   last_name: "Kowalski",
                   company_name: "Design Studio",
                   phone: "123456789",
                   title: "Interior Designer")
  end

  # ============================================================
  # AUTHENTICATION
  # ============================================================

  test "returns 401 without auth" do
    get api_v1_me_path
    assert_response :unauthorized
  end

  # ============================================================
  # ME (GET)
  # ============================================================

  test "me returns current user info" do
    get api_v1_me_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal @user.id, json_response["id"]
    assert_equal @user.email, json_response["email"]
    assert_equal "Jan", json_response["first_name"]
    assert_equal "Kowalski", json_response["last_name"]
    assert_equal "Jan Kowalski", json_response["full_name"]
    assert_equal "Jan Kowalski", json_response["display_name"]
    assert_equal "JK", json_response["initials"]
    assert_equal "Design Studio", json_response["company_name"]
    assert_equal "123456789", json_response["phone"]
    assert_equal "Interior Designer", json_response["title"]
  end

  test "me includes api_token" do
    get api_v1_me_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal @user.api_token, json_response["api_token"]
  end

  test "me returns display_name from email when no name" do
    user = create(:user, first_name: nil, last_name: nil, email: "designer@example.com")

    get api_v1_me_path, headers: auth_headers(user)

    assert_response :success
    assert_equal "designer", json_response["display_name"]
  end

  # ============================================================
  # UPDATE PROFILE
  # ============================================================

  test "update updates profile fields" do
    patch api_v1_me_path,
          params: {
            user: {
              first_name: "Anna",
              last_name: "Nowak",
              company_name: "New Studio",
              phone: "987654321",
              title: "Architect"
            }
          },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Anna", json_response["first_name"]
    assert_equal "Nowak", json_response["last_name"]
    assert_equal "Anna Nowak", json_response["full_name"]
    assert_equal "New Studio", json_response["company_name"]

    @user.reload
    assert_equal "Anna", @user.first_name
    assert_equal "Nowak", @user.last_name
  end

  test "update allows partial updates" do
    patch api_v1_me_path,
          params: { user: { first_name: "Anna" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Anna", json_response["first_name"]
    assert_equal "Kowalski", json_response["last_name"] # unchanged
  end

  test "update does not allow email change" do
    original_email = @user.email

    patch api_v1_me_path,
          params: { user: { email: "newemail@example.com" } },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal original_email, @user.reload.email
  end

  # ============================================================
  # UPDATE PASSWORD
  # ============================================================

  test "update_password changes password" do
    patch api_v1_me_password_path,
          params: {
            current_password: "password123",
            password: "newpassword123",
            password_confirmation: "newpassword123"
          },
          headers: auth_headers(@user)

    assert_response :success
    assert_equal "Hasło zostało zmienione", json_response["message"]
    assert @user.reload.valid_password?("newpassword123")
  end

  test "update_password requires current password" do
    patch api_v1_me_password_path,
          params: {
            password: "newpassword123",
            password_confirmation: "newpassword123"
          },
          headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Aktualne hasło jest wymagane"
  end

  test "update_password validates current password" do
    patch api_v1_me_password_path,
          params: {
            current_password: "wrongpassword",
            password: "newpassword123",
            password_confirmation: "newpassword123"
          },
          headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Aktualne hasło jest nieprawidłowe"
  end

  test "update_password requires matching confirmation" do
    patch api_v1_me_password_path,
          params: {
            current_password: "password123",
            password: "newpassword123",
            password_confirmation: "differentpassword"
          },
          headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Hasła nie są zgodne"
  end

  # ============================================================
  # AVATAR
  # ============================================================

  test "upload_avatar attaches avatar" do
    file = fixture_file_upload("test/fixtures/files/avatar.png", "image/png")

    post api_v1_me_avatar_path,
         params: { avatar: file },
         headers: auth_headers(@user)

    assert_response :success
    assert @user.reload.avatar.attached?
    assert json_response["avatar_url"].present?
  end

  test "upload_avatar requires file" do
    post api_v1_me_avatar_path, headers: auth_headers(@user)

    assert_response :unprocessable_entity
    assert_includes json_response["errors"], "Plik jest wymagany"
  end

  test "destroy_avatar removes avatar" do
    @user.avatar.attach(
      io: StringIO.new("fake image data"),
      filename: "avatar.png",
      content_type: "image/png"
    )
    assert @user.avatar.attached?

    delete api_v1_me_avatar_path, headers: auth_headers(@user)

    assert_response :success
    assert_equal "Avatar został usunięty", json_response["message"]
    assert_not @user.reload.avatar.attached?
  end

  test "destroy_avatar succeeds even without avatar" do
    assert_not @user.avatar.attached?

    delete api_v1_me_avatar_path, headers: auth_headers(@user)

    assert_response :success
  end
end
