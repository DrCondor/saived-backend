# frozen_string_literal: true

ActiveAdmin.register User do
  menu priority: 2

  # Replace new/create with invitation system
  actions :all, except: [ :new, :create ]

  # Pagination
  config.per_page = 25

  # Scope buttons
  scope :all, default: true
  scope("Active (7d)") do |users|
    user_ids = ProductCaptureSample.where("created_at > ?", 7.days.ago)
                                   .select(:user_id).distinct.pluck(:user_id)
    users.where(id: user_ids)
  end
  scope("New (30d)") { |users| users.where("created_at > ?", 30.days.ago) }
  scope("Pending Invitation") { |users| users.invitation_not_accepted }

  # Filters
  filter :email
  filter :first_name
  filter :last_name
  filter :company_name
  filter :created_at

  # Invite User button
  action_item :invite_user, only: :index do
    link_to "Zapros uzytkownika", invite_admin_users_path, class: "action-item-button"
  end

  # Index columns
  index do
    selectable_column
    id_column
    column :email
    column :full_name
    column("Status") do |user|
      if user.invitation_accepted_at.present?
        status_tag "Aktywny", class: "ok"
      elsif user.invitation_sent_at.present?
        status_tag "Oczekuje", class: "warning"
      else
        status_tag "Aktywny", class: "ok"
      end
    end
    column :company_name
    column "Projects" do |user|
      user.owned_projects.count
    end
    column "Captures" do |user|
      user.product_capture_samples.count
    end
    column :created_at
    actions defaults: true do |user|
      if user.invitation_sent_at.present? && user.invitation_accepted_at.blank?
        link_to "Wyslij ponownie", resend_invitation_admin_user_path(user),
                method: :post,
                class: "member_link"
      end
    end
  end

  # Show page
  show do
    attributes_table do
      row :id
      row :email
      row :first_name
      row :last_name
      row :full_name
      row :company_name
      row :phone
      row :title
      row :api_token do |user|
        code user.api_token
      end
      row :created_at
      row :updated_at
    end

    panel "Statistics" do
      attributes_table_for resource do
        row("Owned Projects") { resource.owned_projects.count }
        row("Shared Projects") { resource.projects.count }
        row("Total Captures") { resource.product_capture_samples.count }
        row("Captures (Last 7 Days)") { resource.product_capture_samples.where("created_at > ?", 7.days.ago).count }
        row("Unique Domains") { resource.product_capture_samples.select(:domain).distinct.count }
      end
    end

    panel "Recent Captures" do
      samples = resource.product_capture_samples.order(created_at: :desc).limit(10)

      if samples.any?
        table_for samples do
          column(:domain)
          column(:url) { |s| truncate(s.url, length: 50) }
          column(:created_at)
          column("") { |s| link_to "View", admin_product_capture_sample_path(s) }
        end
      else
        para "No captures yet."
      end
    end

    panel "Projects" do
      projects = resource.owned_projects.order(created_at: :desc)

      if projects.any?
        table_for projects do
          column(:name)
          column("Sections") { |p| p.sections.count }
          column(:created_at)
        end
      else
        para "No projects yet."
      end
    end
  end

  # Form for editing
  form do |f|
    f.inputs "User Details" do
      f.input :email
      f.input :first_name
      f.input :last_name
      f.input :company_name
      f.input :phone
      f.input :title
    end
    f.actions
  end

  # Custom action: Regenerate API Token
  member_action :regenerate_api_token, method: :post do
    resource.regenerate_api_token
    redirect_to admin_user_path(resource), notice: "API token regenerated!"
  end

  action_item :regenerate_token, only: :show do
    link_to "Regenerate API Token", regenerate_api_token_admin_user_path(resource),
            method: :post,
            data: { confirm: "This will invalidate the user's current API token. Continue?" }
  end

  # Permitted parameters
  permit_params :email, :first_name, :last_name, :company_name, :phone, :title

  # === Invitation Actions ===

  # Invite form
  collection_action :invite, method: :get do
    @user = User.new
  end

  # Send invitation
  collection_action :send_invitation, method: :post do
    @user = User.invite!(email: params[:user][:email], skip_invitation: false)

    if @user.errors.empty?
      redirect_to admin_users_path, notice: "Zaproszenie wyslane na #{@user.email}!"
    else
      flash.now[:error] = @user.errors.full_messages.join(", ")
      render :invite
    end
  end

  # Resend invitation
  member_action :resend_invitation, method: :post do
    resource.invite!
    redirect_to admin_users_path, notice: "Zaproszenie wyslane ponownie na #{resource.email}!"
  end
end
