class AddDeletedAtToProjectItems < ActiveRecord::Migration[7.2]
  def change
    add_column :project_items, :deleted_at, :datetime
    add_index :project_items, :deleted_at
  end
end
