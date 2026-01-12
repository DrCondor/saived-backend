FactoryBot.define do
  factory :project do
    association :owner, factory: :user
    sequence(:name) { |n| "Project #{n}" }
    description { Faker::Lorem.sentence(word_count: 10) }
    favorite { false }
    position { nil }

    trait :favorite do
      favorite { true }
    end

    trait :with_sections do
      transient do
        sections_count { 2 }
      end

      after(:create) do |project, evaluator|
        project.sections.destroy_all  # Remove default section
        create_list(:project_section, evaluator.sections_count, project: project)
        project.sections.reload  # Reload to clear cache
      end
    end

    trait :with_items do
      transient do
        sections_count { 2 }
        items_per_section { 3 }
      end

      after(:create) do |project, evaluator|
        project.sections.destroy_all  # Remove default section
        create_list(:project_section, evaluator.sections_count, :with_items,
                    project: project,
                    items_count: evaluator.items_per_section)
        project.sections.reload  # Reload to clear cache
      end
    end
  end
end
