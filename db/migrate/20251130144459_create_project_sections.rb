class CreateProjectSections < ActiveRecord::Migration[7.2]
  def change
    create_table :project_sections do |t|
      t.references :project, null: false, foreign_key: true
      t.string :name, null: false
      t.integer :position, null: false, default: 0

      t.timestamps
    end
  end
end
