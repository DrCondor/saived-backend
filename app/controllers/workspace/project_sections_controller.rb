module Workspace
  class ProjectSectionsController < BaseController
    before_action :set_project

    def create
      @section = @project.sections.new
      # jeśli kiedyś będziemy przekazywać nazwę, to ją wykorzystamy,
      # a jak nie – leci domyślna
      @section.name = params.dig(:project_section, :name).presence || "Nowa sekcja"
      @section.position = (@project.sections.maximum(:position) || 0) + 1

      if @section.save
        redirect_to workspace_projects_path(project_id: @project.id, section_id: @section.id)
      else
        redirect_to workspace_projects_path(project_id: @project.id),
                    alert: "Nie udało się utworzyć sekcji."
      end
    end

    def update
      @section = @project.sections.find(params[:id])

      if @section.update(section_params)
        redirect_to workspace_projects_path(project_id: @project.id, section_id: @section.id),
                    notice: "Nazwa sekcji została zaktualizowana."
      else
        redirect_to workspace_projects_path(project_id: @project.id, section_id: @section.id),
                    alert: "Nie udało się zaktualizować sekcji."
      end
    end

    private

    def set_project
      @project = current_user.projects.find(params[:project_id])
    end

    def section_params
      params.require(:project_section).permit(:name)
    end
  end
end
