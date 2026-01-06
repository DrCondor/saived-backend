# frozen_string_literal: true

ActiveAdmin.register_page "Dashboard" do
  menu priority: 1, label: proc { I18n.t("active_admin.dashboard") }

  content title: "SAIVED Admin Dashboard" do
    # System Overview Stats
    div class: "dashboard-stats" do
      # Total Users
      div class: "stat-card" do
        div class: "stat-value" do
          User.count
        end
        div class: "stat-label" do
          "Total Users"
        end
      end

      # Active Users (last 7 days)
      div class: "stat-card" do
        div class: "stat-value" do
          ProductCaptureSample.where("created_at > ?", 7.days.ago)
                              .select(:user_id).distinct.count
        end
        div class: "stat-label" do
          "Active Users (7d)"
        end
      end

      # Total Domains Learned
      div class: "stat-card" do
        div class: "stat-value" do
          DomainSelector.select(:domain).distinct.count
        end
        div class: "stat-label" do
          "Domains with Selectors"
        end
      end

      # Capture Samples Today
      div class: "stat-card" do
        div class: "stat-value" do
          ProductCaptureSample.where("created_at > ?", Date.current).count
        end
        div class: "stat-label" do
          "Captures Today"
        end
      end
    end

    # Two-column layout: Domains (2/3) + Recent Captures (1/3)
    div class: "dashboard-row" do
      div class: "dashboard-col-2" do
        panel "Domains Needing Attention" do
          domains_data = domain_stats_needing_attention.first(10)

          if domains_data.any?
            table_for domains_data do
              column("Domain") { |d| link_to d[:domain], admin_domain_selectors_path(q: { domain_eq: d[:domain] }) }
              column("Samples") { |d| d[:samples] }
              column("Avg Confidence") { |d| confidence_badge(d[:avg_confidence]) }
              column("Fields Missing") do |d|
                missing = %w[name price thumbnail_url] - d[:fields]
                missing.any? ? missing.join(", ") : span("All covered", class: "confidence-high")
              end
            end
          else
            para "All domains have good confidence scores!"
          end
        end
      end

      div class: "dashboard-col-1" do
        panel "Recent Captures" do
          samples = ProductCaptureSample.includes(:user).order(created_at: :desc).limit(10)

          if samples.any?
            table_for samples do
              column("Domain") { |s| s.domain }
              column("User") { |s| link_to s.user.display_name, admin_user_path(s.user) }
              column("Time") { |s| time_ago_in_words(s.created_at) + " ago" }
            end
          else
            para "No captures yet."
          end
        end
      end
    end

    # Two equal columns: Health + Top Domains
    div class: "dashboard-row" do
      div class: "dashboard-col-1" do
        panel "Learning System Health" do
          total_selectors = DomainSelector.count
          selectors_array = DomainSelector.all.to_a
          high_confidence = selectors_array.count { |ds| ds.confidence >= 0.7 }
          discovered = DomainSelector.discovered.count

          attributes_table_for :stats do
            row("Total Selectors") { total_selectors }
            row("High Confidence (>70%)") do
              if total_selectors > 0
                percentage = (high_confidence.to_f / total_selectors * 100).round(1)
                "#{high_confidence} (#{percentage}%)"
              else
                "0"
              end
            end
            row("Discovered (from corrections)") { discovered }
            row("Heuristic") { DomainSelector.heuristic.count }
          end
        end
      end

      div class: "dashboard-col-1" do
        panel "Top Domains by Samples" do
          top_domains = ProductCaptureSample.group(:domain)
                                            .order(Arel.sql("count(*) DESC"))
                                            .limit(10)
                                            .count
                                            .map { |domain, count| { domain: domain, samples: count } }

          if top_domains.any?
            table_for top_domains do
              column("Domain") { |d| d[:domain] }
              column("Samples") { |d| d[:samples] }
            end
          else
            para "No capture data yet."
          end
        end
      end
    end
  end

  # Helper methods for dashboard
  controller do
    helper_method :domain_stats_needing_attention, :confidence_badge

    def domain_stats_needing_attention
      domains = DomainSelector.select(:domain).distinct.pluck(:domain)

      domains.map do |domain|
        selectors = DomainSelector.for_domain(domain).to_a
        samples = ProductCaptureSample.where(domain: domain).count

        avg_conf = selectors.any? ? selectors.sum(&:confidence) / selectors.size : 0
        fields_covered = selectors.map(&:field_name).uniq

        {
          domain: domain,
          samples: samples,
          avg_confidence: avg_conf,
          fields: fields_covered,
          selector_count: selectors.size
        }
      end.select { |d| d[:avg_confidence] < 0.7 || d[:fields].size < 3 }
         .sort_by { |d| d[:avg_confidence] }
    end

    def confidence_badge(confidence)
      return "-" if confidence.nil? || confidence.zero?

      css_class = case confidence
                  when 0.7..1.0 then "confidence-high"
                  when 0.4..0.7 then "confidence-medium"
                  else "confidence-low"
                  end
      helpers.content_tag(:span, "#{(confidence * 100).round(1)}%", class: css_class)
    end
  end
end
