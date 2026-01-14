module Api
  module V1
    class CategoriesController < BaseController
      def index
        domain = params[:domain]

        unless domain.present?
          render json: { error: "domain parameter required" }, status: :bad_request
          return
        end

        normalized = DomainCategory.normalize_domain(domain)
        top_category = DomainCategory.top_category_for_domain(normalized)
        all_categories = DomainCategory.best_for_domain(normalized)

        render json: {
          domain: normalized,
          top_category: top_category,
          categories: all_categories.map { |dc|
            {
              category: dc.category_value,
              confidence: dc.confidence,
              samples: dc.total_samples
            }
          },
          stats: {
            total_records: DomainCategory.for_domain(normalized).count,
            total_samples: DomainCategory.for_domain(normalized).sum(:success_count) +
                          DomainCategory.for_domain(normalized).sum(:failure_count)
          }
        }
      end
    end
  end
end
