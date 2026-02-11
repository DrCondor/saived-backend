class AddDeletedAtToProjectSections < ActiveRecord::Migration[7.2]
  def change
    add_column :project_sections, :deleted_at, :datetime
    add_index :project_sections, :deleted_at
  end
end
