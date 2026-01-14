FactoryBot.define do
  factory :domain_category do
    sequence(:domain) { |n| "shop#{n}.pl" }
    category_value { DomainCategory::VALID_CATEGORIES.sample }
    success_count { 0 }
    failure_count { 0 }
    last_seen_at { nil }
    discovery_method { "heuristic" }

    trait :reliable do
      success_count { 10 }
      failure_count { 1 }
    end

    trait :unreliable do
      success_count { 2 }
      failure_count { 8 }
    end

    trait :new_category do
      success_count { 1 }
      failure_count { 0 }
    end

    trait :meble do
      category_value { "meble" }
    end

    trait :tkaniny do
      category_value { "tkaniny" }
    end

    trait :dekoracje do
      category_value { "dekoracje" }
    end

    trait :ikea do
      domain { "ikea.pl" }
    end

    trait :jysk do
      domain { "jysk.pl" }
    end
  end
end
