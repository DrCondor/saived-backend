Rails.application.routes.draw do
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations",
    invitations: "users/invitations"
  }, skip: [ :registrations ]

  # Only allow edit/update/destroy for existing users (no new registrations)
  devise_scope :user do
    get "users/edit", to: "users/registrations#edit", as: :edit_user_registration
    put "users", to: "users/registrations#update", as: :user_registration
    patch "users", to: "users/registrations#update"
    delete "users", to: "users/registrations#destroy"
  end

  get "up" => "rails/health#show", as: :rails_health_check
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  root "pages#home"

  # Static pages
  get "features", to: "pages#features", as: :features
  get "pricing", to: "pages#pricing", as: :pricing
  get "about", to: "pages#about", as: :about
  get "privacy", to: "pages#privacy", as: :privacy
  get "jak-to-dziala", to: "pages#jak_to_dziala", as: :jak_to_dziala

  # API endpoints
  namespace :api do
    namespace :v1 do
      # User profile
      get "me", to: "users#me"
      patch "me", to: "users#update"
      patch "me/password", to: "users#update_password"
      patch "me/statuses", to: "users#update_statuses"
      patch "me/categories", to: "users#update_categories"
      patch "me/discounts", to: "users#update_discounts"
      patch "me/dismiss-extension-update", to: "users#dismiss_extension_update"
      post "me/avatar", to: "users#upload_avatar"
      delete "me/avatar", to: "users#destroy_avatar"
      post "me/company_logo", to: "users#upload_company_logo"
      delete "me/company_logo", to: "users#destroy_company_logo"
      patch "me/organization", to: "users#update_organization"

      # Projects CRUD
      resources :projects, only: [ :index, :show, :create, :update, :destroy ] do
        # Sections nested under projects
        resources :sections, only: [ :create, :update, :destroy ] do
          post :restore, on: :member
        end
        resources :section_groups, only: [ :create, :update, :destroy ] do
          post :restore, on: :member
        end

        # Reordering items within project
        post :reorder, on: :member
        # Toggle favorite
        post :toggle_favorite, on: :member
        # PDF generation
        get :pdf, on: :member
      end

      # Reorder all projects
      post "projects/reorder", to: "projects#reorder_all"

      # Items nested under sections
      resources :project_sections, only: [] do
        resources :items, controller: "project_items", path: "items", only: [ :create, :update, :destroy ] do
          post :restore, on: :member
        end
      end

      # Item favorites
      get "favorites", to: "favorites#index"
      post "favorites/:project_item_id", to: "favorites#create"
      delete "favorites/:project_item_id", to: "favorites#destroy"

      # Learning system: fetch best selectors for a domain
      resources :selectors, only: [ :index ]

      # Learning system: fetch learned categories for a domain
      resources :categories, only: [ :index ]
    end
  end

  # React SPA - catch all workspace routes
  get "workspace", to: "workspace/spa#index"
  get "workspace/*path", to: "workspace/spa#index"
end
