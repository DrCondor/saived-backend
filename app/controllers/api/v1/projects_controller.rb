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

        render json: {
          id: project.id,
          name: project.name,
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
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end
    end
  end
end
