class Users::InvitationsController < Devise::InvitationsController
  layout :choose_layout

  protected

  # After user accepts invitation and sets password, redirect to workspace settings
  def after_accept_path_for(resource)
    "/workspace/settings"
  end

  private

  def choose_layout
    action_name == "edit" ? "application" : "workspace"
  end
end
