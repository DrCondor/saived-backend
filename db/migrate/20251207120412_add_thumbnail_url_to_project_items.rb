class AddThumbnailUrlToProjectItems < ActiveRecord::Migration[7.2]
  def change
    add_column :project_items, :thumbnail_url, :string
  end
end
