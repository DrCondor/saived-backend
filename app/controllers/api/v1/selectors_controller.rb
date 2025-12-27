module Api
  module V1
    class SelectorsController < BaseController
      # GET /api/v1/selectors?domain=ikea.pl
      # Returns best learned selectors for the given domain
      def index
        domain = normalize_domain(params[:domain])

        if domain.blank?
          render json: { error: "Missing domain parameter" }, status: :bad_request
          return
        end

        selectors = DomainSelector.best_for_domain(domain)

        render json: {
          domain: domain,
          selectors: selectors,
          # Include stats for debugging
          stats: build_stats(domain)
        }
      end

      private

      # Normalize domain to handle www. prefix variants
      # e.g., "www.beliani.pl" => "beliani.pl"
      def normalize_domain(domain)
        d = domain.to_s.strip.downcase
        d.sub(/^www\./, "")
      end

      def build_stats(domain)
        all_selectors = DomainSelector.for_domain(domain)

        {
          total_selectors: all_selectors.count,
          total_samples: ProductCaptureSample.where(domain: domain).count,
          discovered_count: all_selectors.discovered.count,
          heuristic_count: all_selectors.heuristic.count,
          fields: DomainSelector::TRACKABLE_FIELDS.map do |field|
            field_selectors = all_selectors.for_field(field).to_a
            best = field_selectors.max_by(&:confidence)

            {
              field: field,
              selector_count: field_selectors.count,
              best_confidence: best&.confidence&.round(2),
              best_selector: best&.selector,
              best_discovery_method: best&.discovery_method
            }
          end
        }
      end
    end
  end
end
