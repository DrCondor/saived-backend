class CreateItemFavorites < ActiveRecord::Migration[7.2]
  def change
    create_table :item_favorites do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project_item, null: false, foreign_key: true
      t.timestamps
    end

    add_index :item_favorites, [:user_id, :project_item_id], unique: true
  end
end
