FactoryBot.define do
  factory :project_section do
    association :project
    sequence(:name) { |n| "Section #{n}" }
    sequence(:position) { |n| n }

    trait :with_items do
      transient do
        items_count { 3 }
      end

      after(:create) do |section, evaluator|
        create_list(:project_item, evaluator.items_count, project_section: section)
      end
    end
  end
end
