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

      # POST /api/v1/me/company_logo
      def upload_company_logo
        unless params[:company_logo].present?
          render json: { errors: [ "Plik jest wymagany" ] }, status: :unprocessable_entity
          return
        end

        current_user.company_logo.attach(params[:company_logo])

        if current_user.company_logo.attached?
          render json: { company_logo_url: company_logo_url(current_user) }
        else
          render json: { errors: [ "Nie udało się przesłać pliku" ] }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/me/company_logo
      def destroy_company_logo
        if current_user.company_logo.attached?
          current_user.company_logo.purge
        end
        render json: { message: "Logo firmy zostało usunięte" }
      end

      # PATCH /api/v1/me/statuses
      def update_statuses
        # Permit nested array of status objects
        permitted = params.permit(custom_statuses: [ :id, :name, :color, :include_in_sum ])
        statuses = permitted[:custom_statuses] || []

        # Validate max 3 custom statuses
        if statuses.length > 3
          render json: { errors: [ "Maksymalnie 3 własne statusy" ] }, status: :unprocessable_entity
          return
        end

        # Validate each status has required fields
        statuses.each do |status|
          unless status[:id].present? && status[:name].present? && status[:color].present?
            render json: { errors: [ "Każdy status musi mieć id, nazwę i kolor" ] }, status: :unprocessable_entity
            return
          end
        end

        if current_user.update_custom_statuses(statuses.map(&:to_h))
          render json: { custom_statuses: current_user.custom_statuses }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/me/discounts
      def update_discounts
        permitted = params.permit(discounts: [ :id, :domain, :percentage, :code ])
        discounts_data = permitted[:discounts] || []

        # Validate max 20 discounts
        if discounts_data.length > 20
          render json: { errors: [ "Maksymalnie 20 rabatów" ] }, status: :unprocessable_entity
          return
        end

        # Validate and normalize each discount
        normalized_discounts = []
        domains_seen = Set.new

        discounts_data.each do |discount|
          # Validate required fields
          unless discount[:id].present? && discount[:domain].present? && discount[:percentage].present?
            render json: { errors: [ "Każdy rabat musi mieć id, domenę i procent" ] }, status: :unprocessable_entity
            return
          end

          # Validate percentage
          percentage = discount[:percentage].to_i
          unless percentage >= 0 && percentage <= 100
            render json: { errors: [ "Procent rabatu musi być między 0 a 100" ] }, status: :unprocessable_entity
            return
          end

          # Normalize domain (lowercase, remove www.)
          normalized_domain = discount[:domain].to_s.strip.downcase
            .gsub(%r{^https?://}, "")
            .gsub(/^www\./, "")
            .split("/").first

          # Check for duplicate domains
          if domains_seen.include?(normalized_domain)
            render json: { errors: [ "Duplikat domeny: #{normalized_domain}" ] }, status: :unprocessable_entity
            return
          end
          domains_seen.add(normalized_domain)

          normalized_discounts << {
            "id" => discount[:id],
            "domain" => normalized_domain,
            "percentage" => percentage,
            "code" => discount[:code].presence
          }
        end

        if current_user.update_discounts(normalized_discounts)
          # Apply discounts to all existing items
          current_user.apply_discounts_to_existing_items
          render json: { discounts: current_user.discounts }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/me/dismiss-extension-update
      def dismiss_extension_update
        version = params[:version].to_i
        current_user.dismiss_extension_update(version)
        head :no_content
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
          company_logo_url: company_logo_url(user),
          api_token: user.api_token,
          custom_statuses: user.custom_statuses,
          discounts: user.discounts,
          seen_extension_version: user.seen_extension_version
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

      def company_logo_url(user)
        return nil unless user.company_logo.attached?

        Rails.application.routes.url_helpers.rails_blob_url(
          user.company_logo,
          only_path: true
        )
      end
    end
  end
end
