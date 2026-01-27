module Api
  module V1
    class SectionGroupsController < BaseController
      before_action :set_project
      before_action :set_section_group, only: [ :update, :destroy ]

      # POST /api/v1/projects/:project_id/section_groups
      def create
        group = @project.section_groups.new(section_group_params)
        group.name = section_group_params[:name].presence || "Nowa grupa"
        group.position = (@project.section_groups.maximum(:position) || 0) + 1

        if group.save
          render json: section_group_json(group), status: :created
        else
          render json: { errors: group.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/projects/:project_id/section_groups/:id
      def update
        if @section_group.update(section_group_params)
          render json: section_group_json(@section_group)
        else
          render json: { errors: @section_group.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/projects/:project_id/section_groups/:id
      def destroy
        @section_group.destroy
        head :no_content
      end

      private

      def set_project
        @project = current_user.projects.find(params[:project_id])
      end

      def set_section_group
        @section_group = @project.section_groups.find(params[:id])
      end

      def section_group_params
        params.fetch(:section_group, {}).permit(:name, :position)
      end

      def section_group_json(group)
        {
          id: group.id,
          name: group.name,
          position: group.position
        }
      end
    end
  end
end
