class AddFavoriteAndPositionToProjects < ActiveRecord::Migration[7.2]
  def change
    add_column :projects, :favorite, :boolean, default: false, null: false
    add_column :projects, :position, :integer

    # Set initial positions for existing projects
    reversible do |dir|
      dir.up do
        execute <<-SQL
          UPDATE projects
          SET position = subquery.row_num
          FROM (
            SELECT id, ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at) as row_num
            FROM projects
          ) AS subquery
          WHERE projects.id = subquery.id
        SQL
      end
    end
  end
end
