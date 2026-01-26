class ItemFavorite < ApplicationRecord
  belongs_to :user
  belongs_to :project_item

  validates :user_id, uniqueness: { scope: :project_item_id }
end
