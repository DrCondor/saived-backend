FactoryBot.define do
  factory :product_capture_sample do
    association :user
    association :project_item, factory: :project_item
    url { Faker::Internet.url(host: "example.com", path: "/product/#{rand(1000..9999)}") }
    domain { "example.com" }
    raw_payload do
      {
        name: "Original Product Name",
        price: "329,99",
        thumbnail_url: "https://example.com/image.jpg"
      }
    end
    final_payload do
      {
        name: "Original Product Name",
        price: "329,99",
        thumbnail_url: "https://example.com/image.jpg"
      }
    end
    context do
      {
        selectors: {
          name: "h1.product-title",
          price: ".price-box",
          thumbnail_url: "img.product-image"
        },
        engine: "heuristic-v1",
        used_learned: {}
      }
    end

    trait :with_corrections do
      raw_payload do
        {
          name: "Wrong Name",
          price: "100,00",
          thumbnail_url: "https://example.com/wrong.jpg"
        }
      end
      final_payload do
        {
          name: "Correct Name",
          price: "329,99",
          thumbnail_url: "https://example.com/correct.jpg"
        }
      end
    end

    trait :no_corrections do
      # raw and final are the same - selector worked correctly
      raw_payload do
        {
          name: "Product Name",
          price: "299,99",
          thumbnail_url: "https://example.com/image.jpg"
        }
      end
      final_payload do
        {
          name: "Product Name",
          price: "299,99",
          thumbnail_url: "https://example.com/image.jpg"
        }
      end
    end

    trait :learned_selectors do
      context do
        {
          selectors: {
            name: "h1.product-title",
            price: ".price-box",
            thumbnail_url: "img.product-image"
          },
          engine: "learned-v1",
          used_learned: {
            name: true,
            price: true
          }
        }
      end
    end

    trait :without_item do
      project_item { nil }
    end
  end
end
