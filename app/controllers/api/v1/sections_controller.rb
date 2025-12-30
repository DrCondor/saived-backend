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
        # Use fetch instead of require to handle empty section hash
        params.fetch(:section, {}).permit(:name, :position)
      end

      def section_json(section)
        {
          id: section.id,
          name: section.name,
          position: section.position,
          total_price: section.total_price,
          items: section.items.order(:position, :created_at).map { |item| item_json(item) }
        }
      end

      def item_json(item)
        {
          id: item.id,
          name: item.name,
          note: item.note,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          currency: item.currency,
          category: item.category,
          dimensions: item.dimensions,
          status: item.status,
          external_url: item.external_url,
          discount_label: item.discount_label,
          thumbnail_url: item.thumbnail_url,
          position: item.position
        }
      end
    end
  end
end
