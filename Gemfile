source "https://rubygems.org"

gem "rails", "~> 8.1.2"
gem "sprockets-rails"
gem "pg", "~> 1.1"
gem "puma", ">= 5.0"
gem "jsbundling-rails"
gem "importmap-rails"  # Required by ActiveAdmin 4.0
gem "turbo-rails"
gem "stimulus-rails"
gem "cssbundling-rails"
gem "jbuilder"
gem "tzinfo-data", platforms: %i[ windows jruby ]
gem "bootsnap", require: false
gem "devise"
gem "devise_invitable"

# Email delivery
gem "resend"

# Admin panel
gem "activeadmin", "~> 4.0.0.beta13"

# Security
gem "rack-attack"

# PDF generation
gem "prawn", "~> 2.5"
gem "prawn-table", "~> 0.2"

# Image processing (for PDF thumbnail optimization)
gem "image_processing", "~> 1.2"

group :development, :test do
  gem "debug", platforms: %i[ mri windows ], require: "debug/prelude"
  gem "brakeman", require: false
  gem "rubocop-rails-omakase", require: false
  gem "factory_bot_rails"
  gem "faker"
  gem "dotenv-rails"
end

group :development do
  gem "web-console"
  gem "letter_opener"
end

group :test do
  gem "capybara"
  gem "selenium-webdriver"
  gem "simplecov", require: false
  gem "webmock"
end

gem "dockerfile-rails", "~> 1.7", :group => :development
