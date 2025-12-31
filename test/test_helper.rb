# SimpleCov must be loaded FIRST before any application code
require "simplecov"
SimpleCov.start "rails" do
  add_filter "/test/"
  add_filter "/config/"
  add_filter "/vendor/"

  add_group "Controllers", "app/controllers"
  add_group "Models", "app/models"
  add_group "Jobs", "app/jobs"
  add_group "Mailers", "app/mailers"

  # Start with low threshold, increase as we add more tests
  minimum_coverage 0
  minimum_coverage_by_file 0
end

ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallelize(workers: :number_of_processors)

    # Include FactoryBot methods
    include FactoryBot::Syntax::Methods

    # Add more helper methods to be used by all tests here...
  end
end

# Base class for API controller tests
class ActionDispatch::IntegrationTest
  include FactoryBot::Syntax::Methods

  # Helper to set Bearer token auth header
  def auth_headers(user)
    { "Authorization" => "Bearer #{user.api_token}" }
  end

  # Helper for JSON responses
  def json_response
    JSON.parse(response.body)
  end
end
