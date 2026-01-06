# frozen_string_literal: true

require "rack/attack"

class Rack::Attack
  ### Rate Limiting for Admin Panel ###

  # Limit admin login attempts: 5 per minute per IP
  throttle("admin/login/ip", limit: 5, period: 60.seconds) do |req|
    if req.path == "/admin/login" && req.post?
      req.ip
    end
  end

  # Limit admin requests per IP: 300 per 5 minutes
  throttle("admin/requests/ip", limit: 300, period: 5.minutes) do |req|
    if req.path.start_with?("/admin")
      req.ip
    end
  end

  # Block requests without User-Agent (likely bots/scripts)
  blocklist("admin/bad_request") do |req|
    req.path.start_with?("/admin") && req.user_agent.blank?
  end

  # Optional: IP whitelist for admin (enable by setting ADMIN_ALLOWED_IPS env var)
  # Example: ADMIN_ALLOWED_IPS=192.168.1.1,10.0.0.1
  if ENV["ADMIN_ALLOWED_IPS"].present?
    allowed_ips = ENV["ADMIN_ALLOWED_IPS"].split(",").map(&:strip)

    blocklist("admin/ip_not_allowed") do |req|
      req.path.start_with?("/admin") && !allowed_ips.include?(req.ip)
    end
  end

  # Custom response for throttled requests
  self.throttled_responder = lambda do |env|
    now = Time.now.utc
    match_data = env["rack.attack.match_data"]

    headers = {
      "Content-Type" => "text/plain",
      "Retry-After" => (match_data[:period] - (now.to_i % match_data[:period])).to_s
    }

    [
      429,
      headers,
      ["Rate limit exceeded. Please wait before retrying.\n"]
    ]
  end

  # Custom response for blocked requests
  self.blocklisted_responder = lambda do |env|
    [403, { "Content-Type" => "text/plain" }, ["Access denied.\n"]]
  end
end

# Enable Rack::Attack
Rails.application.config.middleware.use Rack::Attack
