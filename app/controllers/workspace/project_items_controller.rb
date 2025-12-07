module Workspace
  class ProjectItemsController < BaseController
    before_action :set_section

    def create
      @item = @section.items.new(item_params)
      @item.position = (@section.items.maximum(:position) || 0) + 1

      if @item.save
        redirect_to projects_path(
          project_id: @section.project.id,
          section_id: @section.id,
          anchor: "section-#{@section.id}"
        ), notice: "Pozycja została dodana."
      else
        redirect_to projects_path(
          project_id: @section.project.id,
          section_id: @section.id,
          anchor: "section-#{@section.id}"
        ), alert: "Nie udało się dodać pozycji."
      end
    end

    def destroy
      item = @section.items.find(params[:id])
      item.destroy

      redirect_to projects_path(
        project_id: @section.project.id,
        section_id: @section.id,
        anchor: "section-#{@section.id}"
      ), notice: "Pozycja została usunięta."
    end

    private

    def set_section
      @section = ProjectSection.find(params[:project_section_id])

      # bezpieczeństwo: user musi mieć dostęp do projektu tej sekcji
      unless current_user.projects.exists?(@section.project_id)
        head :not_found
      end
    rescue ActiveRecord::RecordNotFound
      head :not_found
    end

    def item_params
      params.require(:project_item).permit(
        :name,
        :note,
        :quantity,
        :unit_price,
        :currency,
        :category,
        :dimensions,
        :status,
        :external_url,
        :discount_label,
        :thumbnail_url
      )
    end
  end
end
