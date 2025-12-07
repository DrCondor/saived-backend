module Workspace
  class DashboardController < BaseController
    def index
      redirect_to projects_path
    end
  end
end
