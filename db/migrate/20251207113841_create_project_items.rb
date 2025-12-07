class CreateProjectItems < ActiveRecord::Migration[7.2]
  def change
    create_table :project_items do |t|
      t.references :project_section, null: false, foreign_key: true

      t.string  :name,           null: false
      t.text    :note
      t.integer :quantity,       null: false, default: 1
      t.integer :unit_price_cents
      t.string  :currency,       null: false, default: "PLN"
      t.string  :category
      t.string  :dimensions
      t.string  :status
      t.string  :external_url
      t.string  :discount_label

      t.integer :position,       null: false, default: 0

      t.timestamps
    end
  end
end
