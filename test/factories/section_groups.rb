FactoryBot.define do
  factory :section_group do
    association :project
    sequence(:name) { |n| "Group #{n}" }
    sequence(:position) { |n| n }
  end
end
