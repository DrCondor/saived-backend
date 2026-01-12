class AddUnitTypeToProjectItems < ActiveRecord::Migration[7.2]
  def change
    add_column :project_items, :unit_type, :string, default: 'szt', null: false
  end
end
