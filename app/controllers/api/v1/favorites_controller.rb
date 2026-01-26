module Api
  module V1
    class FavoritesController < BaseController
      # GET /api/v1/favorites
      def index
        items = current_user.favorite_items.includes(project_section: :project)
        render json: items.map { |item| favorite_item_json(item) }
      end

      # POST /api/v1/favorites/:project_item_id
      def create
        item = find_accessible_item
        current_user.item_favorites.find_or_create_by(project_item: item)
        render json: { id: item.id, favorite: true }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      # DELETE /api/v1/favorites/:project_item_id
      def destroy
        item = find_accessible_item
        current_user.item_favorites.where(project_item: item).destroy_all
        render json: { id: item.id, favorite: false }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      private

      def find_accessible_item
        ProjectItem.joins(project_section: :project)
                   .where(projects: { id: current_user.projects.select(:id) })
                   .find(params[:project_item_id])
      end

      def favorite_item_json(item)
        {
          id: item.id,
          name: item.name,
          thumbnail_url: item.thumbnail_url,
          total_price: item.total_price,
          currency: item.currency,
          external_url: item.external_url,
          item_type: item.item_type,
          project_id: item.project_section.project_id,
          project_name: item.project_section.project.name,
          section_name: item.project_section.name
        }
      end
    end
  end
end
