FactoryBot.define do
  factory :project_item do
    association :project_section
    sequence(:name) { |n| "Product #{n}" }
    note { Faker::Lorem.sentence(word_count: 5) }
    quantity { rand(1..5) }
    unit_price_cents { rand(1000..100000) } # 10 PLN - 1000 PLN
    currency { "PLN" }
    category { %w[Meble Oswietlenie Tekstylia Dekoracje Elektronika].sample }
    dimensions { "#{rand(50..200)}x#{rand(50..200)}x#{rand(30..100)} cm" }
    status { %w[Propozycja Wybrane Zamowione Dostarczone].sample }
    external_url { Faker::Internet.url(host: "example.com", path: "/product/#{rand(1000..9999)}") }
    thumbnail_url { Faker::Internet.url(host: "example.com", path: "/images/#{rand(1000..9999)}.jpg") }
    discount_label { nil }
    sequence(:position) { |n| n }

    trait :proposal do
      status { "Propozycja" }
    end

    trait :selected do
      status { "Wybrane" }
    end

    trait :ordered do
      status { "Zamowione" }
    end

    trait :with_discount do
      discount_label { "-#{rand(5..30)}%" }
    end

    trait :without_price do
      unit_price_cents { nil }
    end

    # Convenience method for setting price in decimal format
    transient do
      unit_price { nil }
    end

    after(:build) do |item, evaluator|
      if evaluator.unit_price.present?
        item.unit_price_cents = (evaluator.unit_price * 100).to_i
      end
    end
  end
end
