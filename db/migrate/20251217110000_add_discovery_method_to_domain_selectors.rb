class AddDiscoveryMethodToDomainSelectors < ActiveRecord::Migration[7.2]
  def change
    add_column :domain_selectors, :discovery_method, :string, default: 'heuristic', null: false
    add_column :domain_selectors, :discovery_score, :integer  # Score from client-side analysis

    add_index :domain_selectors, :discovery_method
  end
end
