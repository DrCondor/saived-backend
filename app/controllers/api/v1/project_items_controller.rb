module Api
  module V1
    class ProjectItemsController < BaseController
      include Rails.application.routes.url_helpers

      before_action :set_section
      before_action :set_item, only: [ :update, :destroy ]

      def create
        item = @section.items.new(item_params)

        # Apply manual discount if present, otherwise try automatic discount
        if item.discount_percent.present? && item.discount_percent > 0
          apply_manual_discount(item)
        else
          apply_discount_if_applicable(item)
        end

        if item.save
          create_capture_sample(item)
          render json: item_json(item), status: :created
        else
          render json: { errors: item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH /api/v1/project_sections/:section_id/items/:id
      def update
        @item.assign_attributes(item_params)

        # Handle discount changes
        handle_discount_update(@item)

        if @item.save
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
          unit_type: item.unit_type,
          unit_price: item.unit_price,
          total_price: item.total_price,
          currency: item.currency,
          category: item.category,
          dimensions: item.dimensions,
          status: item.status,
          external_url: item.external_url,
          discount_label: item.discount_label,
          discount_percent: item.discount_percent,
          discount_code: item.discount_code,
          original_unit_price: item.original_unit_price_cents ? item.original_unit_price_cents / 100.0 : nil,
          thumbnail_url: item.thumbnail_url,
          # Contractor fields
          item_type: item.item_type,
          address: item.address,
          phone: item.phone,
          attachment_url: item.attachment.attached? ? rails_blob_url(item.attachment, only_path: true) : nil,
          attachment_filename: item.attachment.attached? ? item.attachment.filename.to_s : nil
        }
      end

      # kontrakt: "product_item": { ... }
      def item_params
        params.require(:product_item).permit(
          :name,
          :note,
          :quantity,
          :unit_type,
          :unit_price,
          :currency,
          :category,
          :dimensions,
          :status,
          :external_url,
          :discount_label,
          :discount_percent,
          :discount_code,
          :thumbnail_url,
          # Contractor fields
          :item_type,
          :address,
          :phone,
          :attachment
        )
      end

      def apply_manual_discount(item)
        return unless item.discount_percent.present? && item.discount_percent > 0

        # Use original price or current price as base
        base_price = item.original_unit_price_cents || item.unit_price_cents
        return unless base_price && base_price > 0

        # Store original price if not already stored
        item.original_unit_price_cents ||= item.unit_price_cents

        # Calculate discounted price
        item.unit_price_cents = (base_price * (100 - item.discount_percent) / 100.0).round

        # Generate label
        if item.discount_code.present?
          item.discount_label = "-#{item.discount_percent}% (#{item.discount_code})"
        else
          item.discount_label = "-#{item.discount_percent}%"
        end
      end

      def remove_manual_discount(item)
        return unless item.original_unit_price_cents.present?

        # Restore original price
        item.unit_price_cents = item.original_unit_price_cents
        item.original_unit_price_cents = nil
        item.discount_label = nil
        item.discount_code = nil
        item.discount_percent = nil
      end

      def handle_discount_update(item)
        # Check if discount_percent changed
        if item.discount_percent_changed? || item.discount_code_changed?
          if item.discount_percent.present? && item.discount_percent > 0
            apply_manual_discount(item)
          elsif item.discount_percent_was.present? && item.discount_percent_was > 0
            # Manual discount was removed - restore original price
            remove_manual_discount(item)
            # Try to re-apply automatic discount from settings (if exists for this domain)
            apply_discount_if_applicable(item)
          elsif item.discount_code_changed? && item.discount_percent.present? && item.discount_percent > 0
            # Only discount_code changed (cleared or updated), but discount_percent stays
            # Regenerate the label
            apply_manual_discount(item)
          end
        end
      end

      def apply_discount_if_applicable(item)
        return unless item.external_url.present?
        return unless item.unit_price_cents.present? && item.unit_price_cents > 0

        domain = extract_domain(item.external_url)
        return unless domain

        discount = current_user.discount_for_domain(domain)
        return unless discount

        percentage = discount["percentage"].to_i
        return if percentage <= 0

        # Store original price before applying discount
        item.original_unit_price_cents = item.unit_price_cents

        # Calculate discounted price
        discounted_cents = (item.original_unit_price_cents * (100 - percentage) / 100.0).round
        item.unit_price_cents = discounted_cents

        # Set discount label only (NOT discount_percent/discount_code - those are for manual overrides)
        # This way the input fields stay empty, showing user that this is an automatic discount
        code = discount["code"]
        if code.present?
          item.discount_label = "-#{percentage}% (#{code})"
        else
          item.discount_label = "-#{percentage}%"
        end
      end

      def extract_domain(url)
        uri = URI.parse(url)
        host = uri.host.to_s.downcase
        host.gsub(/^www\./, "")
      rescue URI::InvalidURIError
        nil
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
