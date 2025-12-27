module Api
  module V1
    class ProjectsController < BaseController
      def index
        projects = current_user.projects.includes(:sections)

        render json: {
          projects: projects.map { |project|
            {
              id: project.id,
              name: project.name,
              created_at: project.created_at,
              total_price: project.total_price,
              sections: project.sections.order(:position, :created_at).map { |section|
                {
                  id: section.id,
                  name: section.name,
                  position: section.position
                }
              }
            }
          }
        }
      end

      def show
        project = current_user.projects
                              .includes(sections: :items)
                              .find(params[:id])

        render json: project_json(project)
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # POST /api/v1/projects
      def create
        project = current_user.owned_projects.new(project_params)

        ActiveRecord::Base.transaction do
          project.save!
          ProjectMembership.create!(project: project, user: current_user, role: "owner")
        end

        render json: project_json(project), status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      # PATCH /api/v1/projects/:id
      def update
        project = current_user.projects.find(params[:id])

        if project.update(project_params)
          render json: project_json(project)
        else
          render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # DELETE /api/v1/projects/:id
      def destroy
        project = current_user.projects.find(params[:id])
        project.destroy
        head :no_content
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      private

      def project_params
        params.require(:project).permit(:name, :description)
      end

      def project_json(project)
        {
          id: project.id,
          name: project.name,
          description: project.description,
          total_price: project.total_price,
          sections: project.sections.order(:position, :created_at).map { |section|
            {
              id: section.id,
              name: section.name,
              position: section.position,
              total_price: section.total_price,
              items: section.items.order(:position, :created_at).map { |item|
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
                  thumbnail_url: item.thumbnail_url
                }
              }
            }
          }
        }
      end
    end
  end
end
