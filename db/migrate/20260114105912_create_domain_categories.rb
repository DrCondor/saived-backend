class CreateDomainCategories < ActiveRecord::Migration[7.2]
  def change
    create_table :domain_categories do |t|
      t.string :domain, null: false
      t.string :category_value, null: false
      t.integer :success_count, default: 0, null: false
      t.integer :failure_count, default: 0, null: false
      t.string :discovery_method, default: "heuristic"
      t.datetime :last_seen_at
      t.timestamps

      t.index [:domain, :category_value], unique: true
      t.index :domain
    end
  end
end
