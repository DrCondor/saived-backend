class CreateProductCaptureSamples < ActiveRecord::Migration[7.2]
  def change
    create_table :product_capture_samples do |t|
      t.references :user, null: false, foreign_key: true
      t.references :project_item, null: true, foreign_key: true

      t.string :url, null: false
      t.string :domain, null: false

      t.jsonb :raw_payload, null: false, default: {}
      t.jsonb :final_payload, null: false, default: {}
      t.jsonb :context, null: false, default: {}

      t.timestamps
    end

    add_index :product_capture_samples, :domain
    add_index :product_capture_samples, :created_at
  end
end
