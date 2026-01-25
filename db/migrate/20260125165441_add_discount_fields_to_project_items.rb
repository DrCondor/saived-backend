class AddDiscountFieldsToProjectItems < ActiveRecord::Migration[7.2]
  def change
    add_column :project_items, :discount_percent, :integer
    add_column :project_items, :discount_code, :string
  end
end
