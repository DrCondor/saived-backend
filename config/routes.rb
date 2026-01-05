Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
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

  # API endpoints
  namespace :api do
    namespace :v1 do
      # User profile
      get "me", to: "users#me"
      patch "me", to: "users#update"
      patch "me/password", to: "users#update_password"
      post "me/avatar", to: "users#upload_avatar"
      delete "me/avatar", to: "users#destroy_avatar"

      # Projects CRUD
      resources :projects, only: [ :index, :show, :create, :update, :destroy ] do
        # Sections nested under projects
        resources :sections, only: [ :create, :update, :destroy ]

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
        resources :items, controller: "project_items", path: "items", only: [ :create, :update, :destroy ]
      end

      # Learning system: fetch best selectors for a domain
      resources :selectors, only: [ :index ]
    end
  end

  # React SPA - catch all workspace routes
  get "workspace", to: "workspace/spa#index"
  get "workspace/*path", to: "workspace/spa#index"
end
