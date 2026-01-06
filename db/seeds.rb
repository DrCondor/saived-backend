# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Admin Users
# In development: uses default password "password123"
# In production: requires ADMIN_KONRAD_PASSWORD and ADMIN_MARTYNA_PASSWORD env vars

if Rails.env.development?
  # Development admin accounts
  AdminUser.find_or_create_by!(email: "konrad@saived.ai") do |admin|
    admin.password = "password123"
    admin.name = "Konrad"
  end

  AdminUser.find_or_create_by!(email: "martyna@saived.ai") do |admin|
    admin.password = "password123"
    admin.name = "Martyna"
  end

  puts "Admin users created for development:"
  puts "  - konrad@saived.ai (password: password123)"
  puts "  - martyna@saived.ai (password: password123)"
end

if Rails.env.production?
  # Production admin accounts - require env vars
  if ENV["ADMIN_KONRAD_PASSWORD"].present?
    AdminUser.find_or_create_by!(email: "konrad@saived.pl") do |admin|
      admin.password = ENV["ADMIN_KONRAD_PASSWORD"]
      admin.name = "Konrad"
    end
    puts "Admin user created: konrad@saived.pl"
  end

  if ENV["ADMIN_MARTYNA_PASSWORD"].present?
    AdminUser.find_or_create_by!(email: "martyna@saived.pl") do |admin|
      admin.password = ENV["ADMIN_MARTYNA_PASSWORD"]
      admin.name = "Martyna"
    end
    puts "Admin user created: martyna@saived.pl"
  end
end
