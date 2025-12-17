class Users::RegistrationsController < Devise::RegistrationsController
  layout :choose_layout

  protected

  def after_sign_up_path_for(resource)
    workspace_dashboard_path
  end

  def after_inactive_sign_up_path_for(resource)
    workspace_dashboard_path
  end

  def after_update_path_for(resource)
    workspace_projects_path
  end

  private

  def choose_layout
    user_signed_in? ? "workspace" : "application"
  end
end
