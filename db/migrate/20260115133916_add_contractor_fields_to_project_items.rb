class AddContractorFieldsToProjectItems < ActiveRecord::Migration[7.2]
  def change
    add_column :project_items, :item_type, :string, default: "product", null: false
    add_column :project_items, :address, :string
    add_column :project_items, :phone, :string

    add_index :project_items, :item_type
  end
end
