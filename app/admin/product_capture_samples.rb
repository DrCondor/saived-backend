# frozen_string_literal: true

ActiveAdmin.register ProductCaptureSample do
  menu priority: 4, label: "Capture Samples"

  # Read-only for data integrity
  actions :index, :show

  config.per_page = 30

  # Scopes
  scope :all, default: true
  scope("Today") { |samples| samples.where("created_at >= ?", Date.current) }
  scope("This Week") { |samples| samples.where("created_at >= ?", 1.week.ago) }
  scope("Has Corrections") do |samples|
    # Samples where raw and final differ
    samples.where("raw_payload::text != final_payload::text")
  end

  # Filters
  filter :domain
  filter :user, as: :select, collection: -> { User.pluck(:email, :id) }
  filter :url
  filter :created_at

  # Index
  index do
    id_column
    column :domain
    column :user do |sample|
      link_to sample.user.display_name, admin_user_path(sample.user)
    end
    column :url do |sample|
      truncate(sample.url, length: 50)
    end
    column "Engine" do |sample|
      sample.context&.dig("engine") || "unknown"
    end
    column "Had Corrections" do |sample|
      if sample.raw_payload.to_s != sample.final_payload.to_s
        status_tag "Yes", class: "warning"
      else
        status_tag "No", class: "ok"
      end
    end
    column :created_at
    actions
  end

  # Show - detailed debugging view
  show do
    attributes_table do
      row :id
      row :domain
      row :url do |sample|
        link_to sample.url, sample.url, target: "_blank", rel: "noopener"
      end
      row :user do |sample|
        link_to sample.user.display_name, admin_user_path(sample.user)
      end
      row :project_item do |sample|
        if sample.project_item
          "Item ##{sample.project_item_id}"
        else
          "Not linked"
        end
      end
      row :created_at
    end

    panel "Context" do
      context = resource.context || {}

      attributes_table_for context do
        row("Engine") { context["engine"] || "unknown" }
        row("Selectors Used") do
          if context["selectors"].present?
            pre JSON.pretty_generate(context["selectors"]), class: "json-view"
          else
            "None"
          end
        end
        row("Discovered Selectors") do
          if context["discovered_selectors"].present?
            pre JSON.pretty_generate(context["discovered_selectors"]), class: "json-view"
          else
            "None"
          end
        end
      end
    end

    columns do
      column do
        panel "Raw Payload (Scraped)" do
          if resource.raw_payload.present?
            pre JSON.pretty_generate(resource.raw_payload), class: "json-view"
          else
            para "No raw payload"
          end
        end
      end

      column do
        panel "Final Payload (User Saved)" do
          if resource.final_payload.present?
            pre JSON.pretty_generate(resource.final_payload), class: "json-view"
          else
            para "No final payload"
          end
        end
      end
    end

    panel "Differences Analysis" do
      differences = []

      raw = resource.raw_payload || {}
      final = resource.final_payload || {}

      # Check key fields
      %w[name unit_price thumbnail_url].each do |key|
        raw_value = raw[key]
        final_value = final[key]

        # Handle price specially (raw might be string, final might be cents)
        if key == "unit_price" && final["unit_price_cents"]
          final_value = final["unit_price_cents"].to_f / 100
        end

        if raw_value.to_s != final_value.to_s
          differences << { field: key, raw: raw_value, final: final_value }
        end
      end

      if differences.any?
        table_for differences do
          column :field
          column :raw
          column :final
        end
      else
        para "No differences - selectors worked correctly!", class: "confidence-high"
      end
    end

    panel "Related Domain Selectors" do
      selectors = DomainSelector.for_domain(resource.domain)

      if selectors.any?
        table_for selectors do
          column :field_name
          column :selector do |ds|
            code(truncate(ds.selector, length: 50))
          end
          column("Confidence") do |ds|
            confidence = ds.confidence
            css = case confidence
                  when 0.7..1.0 then "confidence-high"
                  when 0.4..0.7 then "confidence-medium"
                  else "confidence-low"
                  end
            span "#{(confidence * 100).round(1)}%", class: css
          end
          column :discovery_method
        end
      else
        para "No selectors for this domain yet."
      end
    end
  end
end
