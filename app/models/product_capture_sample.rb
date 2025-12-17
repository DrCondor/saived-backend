class ProductCaptureSample < ApplicationRecord
  belongs_to :user
  belongs_to :project_item, optional: true

  validates :url, :domain, presence: true
end
