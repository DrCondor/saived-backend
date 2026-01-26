class CreateOrganizations < ActiveRecord::Migration[7.2]
  def up
    # 1. Create organizations table
    create_table :organizations do |t|
      t.string :name
      t.string :nip
      t.string :phone
      t.text :company_info
      t.timestamps
    end

    # 2. Add organization_id to users
    add_reference :users, :organization, foreign_key: true

    # 3. Migrate existing data
    User.reset_column_information

    # Users with company_name
    User.where.not(company_name: [nil, ""]).find_each do |user|
      org = Organization.create!(name: user.company_name)
      user.update_column(:organization_id, org.id)

      # Move logo if exists
      if user.company_logo.attached?
        org.logo.attach(user.company_logo.blob)
      end
    end

    # Users with logo but no company_name
    User.where(company_name: [nil, ""]).find_each do |user|
      next unless user.respond_to?(:company_logo) && user.company_logo.attached?
      org = Organization.create!(name: nil)
      user.update_column(:organization_id, org.id)
      org.logo.attach(user.company_logo.blob)
    end
  end

  def down
    # Restore data to users
    User.includes(:organization).find_each do |user|
      next unless user.organization
      user.update_column(:company_name, user.organization.name)
      if user.organization.respond_to?(:logo) && user.organization.logo.attached?
        user.company_logo.attach(user.organization.logo.blob)
      end
    end

    remove_reference :users, :organization
    drop_table :organizations
  end
end
