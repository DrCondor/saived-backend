class CreateDomainSelectors < ActiveRecord::Migration[7.2]
  def change
    create_table :domain_selectors do |t|
      t.string :domain, null: false
      t.string :field_name, null: false    # name, price, thumbnail_url
      t.string :selector, null: false      # CSS selector
      t.integer :success_count, default: 0, null: false
      t.integer :failure_count, default: 0, null: false
      t.datetime :last_seen_at

      t.timestamps
    end

    # For fast lookups: "give me best selectors for ikea.pl"
    add_index :domain_selectors, [:domain, :field_name]

    # Unique constraint: one record per (domain, field_name, selector)
    add_index :domain_selectors, [:domain, :field_name, :selector], unique: true, name: 'idx_domain_selectors_unique'

    # For finding popular/reliable selectors across all domains
    add_index :domain_selectors, :success_count
  end
end
