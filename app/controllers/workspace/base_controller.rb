module Workspace
  class BaseController < ApplicationController
    layout "workspace"
    before_action :authenticate_user!
  end
end
