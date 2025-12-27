class NormalizeDomainSelectorDomains < ActiveRecord::Migration[7.2]
  def up
    DomainSelector.find_each do |ds|
      normalized = ds.domain.to_s.strip.downcase.sub(/^www\./, "")
      ds.update_column(:domain, normalized) if ds.domain != normalized
    end
  end

  def down
    # No-op - we can't reverse normalization
  end
end
