module Api
  module V1
    class UsersController < BaseController
      # GET /api/v1/me
      def me
        render json: user_json(current_user)
      end

      # PATCH /api/v1/me
      def update
        if current_user.update(profile_params)
          render json: user_json(current_user)
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/me/password
      def update_password
        if params[:current_password].blank?
          render json: { errors: [ "Aktualne hasło jest wymagane" ] }, status: :unprocessable_entity
          return
        end

        unless current_user.valid_password?(params[:current_password])
          render json: { errors: [ "Aktualne hasło jest nieprawidłowe" ] }, status: :unprocessable_entity
          return
        end

        if params[:password] != params[:password_confirmation]
          render json: { errors: [ "Hasła nie są zgodne" ] }, status: :unprocessable_entity
          return
        end

        if current_user.update(password: params[:password])
          # Bypass sign in to update session after password change
          bypass_sign_in(current_user)
          render json: { message: "Hasło zostało zmienione" }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/me/avatar
      def upload_avatar
        unless params[:avatar].present?
          render json: { errors: [ "Plik jest wymagany" ] }, status: :unprocessable_entity
          return
        end

        current_user.avatar.attach(params[:avatar])

        if current_user.avatar.attached?
          render json: { avatar_url: avatar_url(current_user) }
        else
          render json: { errors: [ "Nie udało się przesłać pliku" ] }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/me/avatar
      def destroy_avatar
        if current_user.avatar.attached?
          current_user.avatar.purge
        end
        render json: { message: "Avatar został usunięty" }
      end

      private

      def profile_params
        params.require(:user).permit(:first_name, :last_name, :company_name, :phone, :title)
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name,
          display_name: user.display_name,
          initials: user.initials,
          company_name: user.company_name,
          phone: user.phone,
          title: user.title,
          avatar_url: avatar_url(user),
          api_token: user.api_token
        }
      end

      def avatar_url(user)
        return nil unless user.avatar.attached?

        # Use polymorphic URL for avatar
        Rails.application.routes.url_helpers.rails_blob_url(
          user.avatar,
          only_path: true
        )
      end
    end
  end
end
