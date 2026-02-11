module Api
  module V1
    class SectionGroupsController < BaseController
      before_action :set_project, except: [ :restore ]
      before_action :set_section_group, only: [ :update, :destroy ]
      before_action :set_project_for_restore, only: [ :restore ]
      before_action :set_deleted_section_group, only: [ :restore ]

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
        @section_group.soft_delete!
        head :no_content
      end

      # POST /api/v1/projects/:project_id/section_groups/:id/restore
      def restore
        if @section_group.deleted_at.nil?
          render json: { error: "Group is not deleted" }, status: :unprocessable_entity
          return
        end

        @section_group.restore!
        render json: section_group_json(@section_group.reload)
      rescue ActiveRecord::RecordInvalid => e
        render json: { error: e.message }, status: :unprocessable_entity
      end

      private

      def set_project
        @project = current_user.projects.find(params[:project_id])
      end

      def set_section_group
        @section_group = @project.section_groups.find(params[:id])
      end

      def set_project_for_restore
        @project = current_user.projects.find(params[:project_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      def set_deleted_section_group
        @section_group = SectionGroup.unscoped.where(project_id: @project.id).find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
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
