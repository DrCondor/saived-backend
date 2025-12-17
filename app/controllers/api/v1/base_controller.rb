module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_api_user!

      attr_reader :current_user

      private

      def authenticate_api_user!
        auth_header = request.headers["Authorization"].to_s
        token = auth_header[/\ABearer (.+)\z/, 1]

        if token.present?
          @current_user = User.find_by(api_token: token)
        end

        render json: { error: "Unauthorized" }, status: :unauthorized unless @current_user
      end
    end
  end
end
