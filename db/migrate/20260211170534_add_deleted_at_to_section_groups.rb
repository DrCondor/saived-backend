class AddDeletedAtToSectionGroups < ActiveRecord::Migration[7.2]
  def change
    add_column :section_groups, :deleted_at, :datetime
    add_index :section_groups, :deleted_at
  end
end
