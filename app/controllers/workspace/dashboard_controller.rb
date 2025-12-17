module Workspace
  class DashboardController < BaseController
    def index
      redirect_to workspace_projects_path
    end
  end
end
