# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_01_27_124136) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_admin_comments", force: :cascade do |t|
    t.string "namespace"
    t.text "body"
    t.string "resource_type"
    t.bigint "resource_id"
    t.string "author_type"
    t.bigint "author_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_type", "author_id"], name: "index_active_admin_comments_on_author"
    t.index ["namespace"], name: "index_active_admin_comments_on_namespace"
    t.index ["resource_type", "resource_id"], name: "index_active_admin_comments_on_resource"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "admin_users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.integer "sign_in_count", default: 0, null: false
    t.datetime "current_sign_in_at"
    t.datetime "last_sign_in_at"
    t.string "current_sign_in_ip"
    t.string "last_sign_in_ip"
    t.integer "failed_attempts", default: 0, null: false
    t.string "unlock_token"
    t.datetime "locked_at"
    t.string "name"
    t.datetime "last_activity_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_admin_users_on_email", unique: true
    t.index ["reset_password_token"], name: "index_admin_users_on_reset_password_token", unique: true
    t.index ["unlock_token"], name: "index_admin_users_on_unlock_token", unique: true
  end

  create_table "domain_categories", force: :cascade do |t|
    t.string "domain", null: false
    t.string "category_value", null: false
    t.integer "success_count", default: 0, null: false
    t.integer "failure_count", default: 0, null: false
    t.string "discovery_method", default: "heuristic"
    t.datetime "last_seen_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["domain", "category_value"], name: "index_domain_categories_on_domain_and_category_value", unique: true
    t.index ["domain"], name: "index_domain_categories_on_domain"
  end

  create_table "domain_selectors", force: :cascade do |t|
    t.string "domain", null: false
    t.string "field_name", null: false
    t.string "selector", null: false
    t.integer "success_count", default: 0, null: false
    t.integer "failure_count", default: 0, null: false
    t.datetime "last_seen_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "discovery_method", default: "heuristic", null: false
    t.integer "discovery_score"
    t.index ["discovery_method"], name: "index_domain_selectors_on_discovery_method"
    t.index ["domain", "field_name", "selector"], name: "idx_domain_selectors_unique", unique: true
    t.index ["domain", "field_name"], name: "index_domain_selectors_on_domain_and_field_name"
    t.index ["success_count"], name: "index_domain_selectors_on_success_count"
  end

  create_table "item_favorites", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "project_item_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_item_id"], name: "index_item_favorites_on_project_item_id"
    t.index ["user_id", "project_item_id"], name: "index_item_favorites_on_user_id_and_project_item_id", unique: true
    t.index ["user_id"], name: "index_item_favorites_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name"
    t.string "nip"
    t.string "phone"
    t.text "company_info"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "product_capture_samples", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "project_item_id"
    t.string "url", null: false
    t.string "domain", null: false
    t.jsonb "raw_payload", default: {}, null: false
    t.jsonb "final_payload", default: {}, null: false
    t.jsonb "context", default: {}, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_product_capture_samples_on_created_at"
    t.index ["domain"], name: "index_product_capture_samples_on_domain"
    t.index ["project_item_id"], name: "index_product_capture_samples_on_project_item_id"
    t.index ["user_id"], name: "index_product_capture_samples_on_user_id"
  end

  create_table "project_items", force: :cascade do |t|
    t.bigint "project_section_id", null: false
    t.string "name", null: false
    t.text "note"
    t.integer "quantity", default: 1, null: false
    t.integer "unit_price_cents"
    t.string "currency", default: "PLN", null: false
    t.string "category"
    t.string "dimensions"
    t.string "status"
    t.string "external_url"
    t.string "discount_label"
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "thumbnail_url"
    t.string "unit_type", default: "szt", null: false
    t.string "item_type", default: "product", null: false
    t.string "address"
    t.string "phone"
    t.integer "original_unit_price_cents"
    t.integer "discount_percent"
    t.string "discount_code"
    t.index ["item_type"], name: "index_project_items_on_item_type"
    t.index ["project_section_id"], name: "index_project_items_on_project_section_id"
  end

  create_table "project_memberships", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.bigint "user_id", null: false
    t.string "role", default: "owner", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id", "user_id"], name: "index_project_memberships_on_project_id_and_user_id", unique: true
    t.index ["project_id"], name: "index_project_memberships_on_project_id"
    t.index ["user_id"], name: "index_project_memberships_on_user_id"
  end

  create_table "project_sections", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "section_group_id"
    t.index ["project_id"], name: "index_project_sections_on_project_id"
    t.index ["section_group_id"], name: "index_project_sections_on_section_group_id"
  end

  create_table "projects", force: :cascade do |t|
    t.bigint "owner_id", null: false
    t.string "name"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "favorite", default: false, null: false
    t.integer "position"
    t.index ["owner_id"], name: "index_projects_on_owner_id"
  end

  create_table "section_groups", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "name", null: false
    t.integer "position", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["project_id"], name: "index_section_groups_on_project_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at"
    t.datetime "remember_created_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "api_token"
    t.string "first_name"
    t.string "last_name"
    t.string "company_name"
    t.string "phone"
    t.string "title"
    t.string "invitation_token"
    t.datetime "invitation_created_at"
    t.datetime "invitation_sent_at"
    t.datetime "invitation_accepted_at"
    t.integer "invitation_limit"
    t.string "invited_by_type"
    t.bigint "invited_by_id"
    t.integer "invitations_count", default: 0
    t.jsonb "preferences", default: {}, null: false
    t.bigint "organization_id"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["invitation_token"], name: "index_users_on_invitation_token", unique: true
    t.index ["invited_by_id"], name: "index_users_on_invited_by_id"
    t.index ["invited_by_type", "invited_by_id"], name: "index_users_on_invited_by"
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "item_favorites", "project_items"
  add_foreign_key "item_favorites", "users"
  add_foreign_key "product_capture_samples", "project_items"
  add_foreign_key "product_capture_samples", "users"
  add_foreign_key "project_items", "project_sections"
  add_foreign_key "project_memberships", "projects"
  add_foreign_key "project_memberships", "users"
  add_foreign_key "project_sections", "projects"
  add_foreign_key "project_sections", "section_groups"
  add_foreign_key "projects", "users", column: "owner_id"
  add_foreign_key "section_groups", "projects"
  add_foreign_key "users", "organizations"
end
