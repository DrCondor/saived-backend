# frozen_string_literal: true

ActiveAdmin.register_page "Domain Analytics" do
  menu priority: 5, label: "Domain Analytics"

  content title: "Domain Learning Analytics" do
    # Summary stats
    div class: "dashboard-stats" do
      div class: "stat-card" do
        div(class: "stat-value") { DomainSelector.select(:domain).distinct.count }
        div(class: "stat-label") { "Total Domains" }
      end
      div class: "stat-card" do
        div(class: "stat-value") { DomainSelector.count }
        div(class: "stat-label") { "Total Selectors" }
      end
      div class: "stat-card" do
        div(class: "stat-value") { DomainSelector.discovered.count }
        div(class: "stat-label") { "Discovered Selectors" }
      end
      div class: "stat-card" do
        div(class: "stat-value") { ProductCaptureSample.count }
        div(class: "stat-label") { "Total Samples" }
      end
    end

    # Domain table
    panel "All Domains" do
      domains_data = build_domains_data

      if domains_data.any?
        table_for domains_data do
          column("Domain") { |d| link_to d[:domain], admin_domain_selectors_path(q: { domain_eq: d[:domain] }) }
          column("Samples") { |d| d[:total_samples] }
          column("Selectors") { |d| d[:selector_count] }
          column("Discovered") { |d| d[:discovered_count] }
          column("Avg Conf.") { |d| confidence_badge(d[:avg_confidence]) }
          column("Name") do |d|
            if d[:name_confidence]
              confidence_badge(d[:name_confidence])
            else
              status_tag "Missing", class: "missing"
            end
          end
          column("Price") do |d|
            if d[:price_confidence]
              confidence_badge(d[:price_confidence])
            else
              status_tag "Missing", class: "missing"
            end
          end
          column("Thumb") do |d|
            if d[:thumbnail_confidence]
              confidence_badge(d[:thumbnail_confidence])
            else
              status_tag "Missing", class: "missing"
            end
          end
          column("Last Activity") do |d|
            if d[:last_sample]
              time_ago_in_words(d[:last_sample]) + " ago"
            else
              "-"
            end
          end
        end
      else
        para "No domain data yet. Start capturing products to see analytics."
      end
    end
  end

  controller do
    helper_method :build_domains_data, :confidence_badge

    def build_domains_data
      # Get all unique domains from selectors
      domains = DomainSelector.select(:domain).distinct.pluck(:domain)

      domains.map do |domain|
        selectors = DomainSelector.for_domain(domain).to_a
        samples = ProductCaptureSample.where(domain: domain)

        # Find best selector for each field
        name_selector = selectors.find { |s| s.field_name == "name" }
        price_selector = selectors.find { |s| s.field_name == "price" }
        thumbnail_selector = selectors.find { |s| s.field_name == "thumbnail_url" }

        {
          domain: domain,
          total_samples: samples.count,
          selector_count: selectors.size,
          discovered_count: selectors.count { |s| s.discovery_method == "discovered" },
          avg_confidence: selectors.any? ? (selectors.sum(&:confidence) / selectors.size) : 0,
          name_confidence: name_selector&.confidence,
          price_confidence: price_selector&.confidence,
          thumbnail_confidence: thumbnail_selector&.confidence,
          last_sample: samples.maximum(:created_at)
        }
      end.sort_by { |d| -d[:total_samples] }
    end

    def confidence_badge(confidence)
      return nil if confidence.nil?

      css = case confidence
            when 0.7..1.0 then "confidence-high"
            when 0.4..0.7 then "confidence-medium"
            else "confidence-low"
            end
      helpers.content_tag(:span, "#{(confidence * 100).round(0)}%", class: css)
    end
  end
end
