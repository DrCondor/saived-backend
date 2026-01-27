class CreateSectionGroups < ActiveRecord::Migration[7.2]
  def change
    create_table :section_groups do |t|
      t.references :project, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :position, default: 0, null: false
      t.timestamps
    end

    add_reference :project_sections, :section_group, foreign_key: true, null: true
  end
end
