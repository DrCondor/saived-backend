class ChangeQuantityToDecimalInProjectItems < ActiveRecord::Migration[7.2]
  def change
    change_column :project_items, :quantity, :decimal, precision: 10, scale: 2, default: 1, null: false
  end
end
