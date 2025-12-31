FactoryBot.define do
  factory :domain_selector do
    sequence(:domain) { |n| "shop#{n}.pl" }
    field_name { %w[name price thumbnail_url].sample }
    selector { "h1.product-title" }
    success_count { 0 }
    failure_count { 0 }
    last_seen_at { nil }
    discovery_method { "heuristic" }
    discovery_score { nil }

    trait :reliable do
      success_count { 10 }
      failure_count { 1 }
    end

    trait :unreliable do
      success_count { 2 }
      failure_count { 8 }
    end

    trait :new_selector do
      success_count { 1 }
      failure_count { 0 }
    end

    trait :learned do
      discovery_method { "learned" }
      discovery_score { 85 }
    end

    trait :for_name do
      field_name { "name" }
      selector { "h1.product-title" }
    end

    trait :for_price do
      field_name { "price" }
      selector { ".price-box .current-price" }
    end

    trait :for_thumbnail do
      field_name { "thumbnail_url" }
      selector { "img.product-image" }
    end

    # Helper to set domain and field together
    trait :ikea do
      domain { "ikea.com" }
    end

    trait :ramaro do
      domain { "ramaro.pl" }
    end
  end
end
