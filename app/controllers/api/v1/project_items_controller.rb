module Api
  module V1
    class ProjectItemsController < BaseController
      before_action :set_section
      before_action :set_item, only: [ :update, :destroy ]

      def create
        item = @section.items.new(item_params)

        if item.save
          create_capture_sample(item)

          render json: {
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
          }, status: :created
        else
          render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/project_sections/:section_id/items/:id
      def update
        if @item.update(item_params)
          render json: item_json(@item)
        else
          render json: { errors: @item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/project_sections/:section_id/items/:id
      def destroy
        @item.destroy
        head :no_content
      end

      private

      def set_section
        @section = ProjectSection.find(params[:project_section_id])

        unless current_user.projects.exists?(@section.project_id)
          render json: { error: "Not found" }, status: :not_found
        end
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
      end

      def set_item
        @item = @section.items.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Not found" }, status: :not_found
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
          thumbnail_url: item.thumbnail_url
        }
      end

      # kontrakt: "product_item": { ... }
      def item_params
        params.require(:product_item).permit(
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

      def create_capture_sample(item)
        # capture_context + original_product są opcjonalne
        raw_context        = params[:capture_context]
        original_product   = params[:original_product]

        capture_context =
          if raw_context.is_a?(ActionController::Parameters)
            raw_context.to_unsafe_h
          else
            raw_context || {}
          end

        raw_payload_hash =
          if original_product.is_a?(ActionController::Parameters)
            original_product.to_unsafe_h
          else
            original_product || {}
          end

        url = capture_context["url"].presence || item.external_url
        return unless url.present?

        domain =
          capture_context["domain"].presence ||
          begin
            uri = URI.parse(url)
            uri.host
          rescue URI::InvalidURIError
            nil
          end

        return unless domain.present?

        ProductCaptureSample.create!(
          user: current_user,
          project_item: item,
          url: url,
          domain: domain,
          raw_payload: raw_payload_hash, # <- tu ląduje original_product
          final_payload: {
            name: item.name,
            note: item.note,
            quantity: item.quantity,
            unit_price_cents: item.unit_price_cents,
            currency: item.currency,
            category: item.category,
            dimensions: item.dimensions,
            status: item.status,
            external_url: item.external_url,
            discount_label: item.discount_label,
            thumbnail_url: item.thumbnail_url
          },
          context: capture_context
        )
      rescue StandardError => e
        Rails.logger.error(
          "[ProductCaptureSample] Failed to create sample: #{e.class} - #{e.message}"
        )
      end
    end
  end
end
