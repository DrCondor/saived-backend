class MigrateProjectItemStatuses < ActiveRecord::Migration[7.2]
  def up
    # Migrate old statuses to new ones
    execute <<-SQL
      UPDATE project_items SET status = 'do_wyceny' WHERE status = 'wybrane';
      UPDATE project_items SET status = 'kupione' WHERE status = 'zamówione';
    SQL
  end

  def down
    # Revert to old statuses
    execute <<-SQL
      UPDATE project_items SET status = 'wybrane' WHERE status = 'do_wyceny';
      UPDATE project_items SET status = 'zamówione' WHERE status = 'kupione';
    SQL
  end
end
