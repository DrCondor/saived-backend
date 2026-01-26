FactoryBot.define do
  factory :organization do
    sequence(:name) { |n| "Company #{n}" }
    nip { nil }
    phone { nil }
    company_info { nil }

    trait :with_full_details do
      nip { "123-456-78-90" }
      phone { "+48 123 456 789" }
      company_info { "<b>Test Company Info</b>" }
    end

    trait :with_logo do
      after(:build) do |org|
        org.logo.attach(
          io: File.open(Rails.root.join("test/fixtures/files/avatar.png")),
          filename: "company_logo.png",
          content_type: "image/png"
        )
      end
    end
  end
end
