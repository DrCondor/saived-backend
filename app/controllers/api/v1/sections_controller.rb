module Api
  module V1
    class SectionsController < BaseController
      before_action :set_project
      before_action :set_section, only: [:update, :destroy]

      # POST /api/v1/projects/:project_id/sections
      def create
        section = @project.sections.new(section_params)
        section.name = section_params[:name].presence || "Nowa sekcja"
        section.position = (@project.sections.maximum(:position) || 0) + 1

        if section.save
          render json: section_json(section), status: :created
        else
          render json: { errors: section.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/:project_id/sections/:id
      def update
        if @section.update(section_params)
          render json: section_json(@section)
        else
          render json: { errors: @section.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/:project_id/sections/:id
      def destroy
        @section.destroy
        head :no_content
      end

      private

      def set_project
        @project = current_user.projects.find(params[:project_id])
      end

      def set_section
        @section = @project.sections.find(params[:id])
      end

      def section_params
        params.require(:section).permit(:name, :position)
      end

      def section_json(section)
        {
          id: section.id,
          name: section.name,
          position: section.position,
          total_price: section.total_price
        }
      end
    end
  end
end
