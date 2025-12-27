module Api
  module V1
    class BaseController < ApplicationController
      # Skip CSRF for API token auth, but keep it for session auth
      skip_before_action :verify_authenticity_token, if: :api_token_auth?
      before_action :authenticate_api_user!

      private

      def authenticate_api_user!
        # Try Bearer token first (for extension)
        auth_header = request.headers["Authorization"].to_s
        token = auth_header[/\ABearer (.+)\z/, 1]

        if token.present?
          @current_user = User.find_by(api_token: token)
          return if @current_user
        end

        # Fall back to session auth (for SPA)
        if current_user
          @current_user = current_user
          return
        end

        render json: { error: "Unauthorized" }, status: :unauthorized
      end

      def api_token_auth?
        request.headers["Authorization"].to_s.start_with?("Bearer ")
      end
    end
  end
end
