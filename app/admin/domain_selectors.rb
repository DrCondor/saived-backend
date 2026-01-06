# frozen_string_literal: true

ActiveAdmin.register DomainSelector do
  menu priority: 3, label: "Learning System"

  # Index configuration
  config.per_page = 50

  # Scopes
  scope :all, default: true
  scope("Discovered") { |selectors| selectors.discovered }
  scope("Heuristic") { |selectors| selectors.heuristic }
  scope("High Confidence") do |selectors|
    # Filter in memory since confidence is calculated
    ids = selectors.to_a.select { |s| s.confidence >= 0.7 }.map(&:id)
    selectors.where(id: ids)
  end
  scope("Needs Training") do |selectors|
    # Selectors with low confidence but some samples
    ids = selectors.to_a.select { |s| s.confidence < 0.5 && s.total_samples > 0 }.map(&:id)
    selectors.where(id: ids)
  end

  # Filters
  filter :domain
  filter :field_name, as: :select, collection: DomainSelector::TRACKABLE_FIELDS
  filter :selector
  filter :discovery_method, as: :select, collection: DomainSelector::DISCOVERY_METHODS
  filter :success_count
  filter :failure_count
  filter :last_seen_at

  # Index
  index do
    selectable_column
    id_column
    column :domain
    column :field_name
    column :selector do |ds|
      code(truncate(ds.selector, length: 40))
    end
    column "Samples" do |ds|
      "#{ds.success_count} / #{ds.total_samples}"
    end
    column "Confidence" do |ds|
      confidence = ds.confidence
      css = case confidence
            when 0.7..1.0 then "confidence-high"
            when 0.4..0.7 then "confidence-medium"
            else "confidence-low"
            end
      span "#{(confidence * 100).round(1)}%", class: css
    end
    column :discovery_method do |ds|
      status_tag ds.discovery_method,
                 class: ds.discovery_method == "discovered" ? "discovered" : "heuristic"
    end
    column :last_seen_at
    actions
  end

  # Show
  show do
    attributes_table do
      row :id
      row :domain
      row :field_name
      row :selector do |ds|
        code ds.selector
      end
      row :success_count
      row :failure_count
      row :total_samples
      row "Confidence" do |ds|
        confidence = ds.confidence
        css = case confidence
              when 0.7..1.0 then "confidence-high"
              when 0.4..0.7 then "confidence-medium"
              else "confidence-low"
              end
        span "#{(confidence * 100).round(2)}%", class: css
      end
      row :discovery_method do |ds|
        status_tag ds.discovery_method,
                   class: ds.discovery_method == "discovered" ? "discovered" : "heuristic"
      end
      row :discovery_score
      row :last_seen_at
      row :created_at
      row :updated_at
    end

    panel "Related Selectors for Same Domain" do
      other_selectors = DomainSelector.for_domain(resource.domain)
                                      .where.not(id: resource.id)

      if other_selectors.any?
        table_for other_selectors do
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
          column("") { |ds| link_to "View", admin_domain_selector_path(ds) }
        end
      else
        para "No other selectors for this domain."
      end
    end

    panel "Sample Captures from this Domain" do
      samples = ProductCaptureSample.where(domain: resource.domain)
                                    .order(created_at: :desc)
                                    .limit(5)

      if samples.any?
        table_for samples do
          column :user
          column(:url) { |s| truncate(s.url, length: 40) }
          column :created_at
          column("") { |s| link_to "View", admin_product_capture_sample_path(s) }
        end
      else
        para "No capture samples for this domain."
      end
    end
  end

  # Form
  form do |f|
    f.inputs "Selector Details" do
      f.input :domain
      f.input :field_name, as: :select, collection: DomainSelector::TRACKABLE_FIELDS
      f.input :selector
      f.input :discovery_method, as: :select, collection: DomainSelector::DISCOVERY_METHODS
      f.input :discovery_score
    end
    f.inputs "Statistics (Manual Override)" do
      f.input :success_count
      f.input :failure_count
    end
    f.actions
  end

  # Batch actions
  batch_action :reset_counts do |ids|
    batch_action_collection.find(ids).each do |selector|
      selector.update(success_count: 0, failure_count: 0)
    end
    redirect_to collection_path, notice: "Counts reset for #{ids.size} selectors."
  end

  batch_action :destroy, confirm: "Are you sure you want to delete these selectors?" do |ids|
    batch_action_collection.find(ids).each(&:destroy)
    redirect_to collection_path, notice: "Deleted #{ids.size} selectors."
  end

  # Permitted parameters
  permit_params :domain, :field_name, :selector, :discovery_method, :discovery_score,
                :success_count, :failure_count
end
