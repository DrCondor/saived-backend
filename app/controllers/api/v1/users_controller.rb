module Api
  module V1
    class UsersController < BaseController
      # GET /api/v1/me
      def me
        render json: {
          id: current_user.id,
          email: current_user.email,
          api_token: current_user.api_token
        }
      end
    end
  end
end
