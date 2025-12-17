module Workspace
  class ProjectsController < BaseController
    before_action :set_project, only: [ :show, :edit, :update, :destroy ]

    def index
      @projects = current_user.projects.includes(sections: :items).order(created_at: :asc)

      @current_project =
        if params[:project_id].present?
          @projects.find { |p| p.id == params[:project_id].to_i }
        else
          @projects.first
        end

      @current_section =
        if @current_project
          if params[:section_id].present?
            @current_project.sections.find { |s| s.id == params[:section_id].to_i }
          else
            @current_project.sections.order(:position, :created_at).first
          end
        end
    end

    def show
      redirect_to workspace_projects_path(project_id: @project.id)
    end

    def new
      @project = current_user.owned_projects.new
    end

    def create
      @project = current_user.owned_projects.new(project_params)

      ActiveRecord::Base.transaction do
        @project.save!
        ProjectMembership.create!(
          project: @project,
          user: current_user,
          role: "owner"
        )
      end

      redirect_to workspace_projects_path(project_id: @project.id),
                  notice: "Projekt został utworzony."
    rescue ActiveRecord::RecordInvalid
      render :new, status: :unprocessable_entity
    end

    def edit
    end

    def update
      if @project.update(project_params)
        redirect_to workspace_projects_path(project_id: @project.id),
                    notice: "Projekt został zaktualizowany."
      else
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @project.destroy
      redirect_to workspace_projects_path, notice: "Projekt został usunięty."
    end

    private

    def set_project
      @project = current_user.projects.find(params[:id])
    end

    def project_params
      params.require(:project).permit(:name, :description)
    end
  end
end
