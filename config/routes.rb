Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  get "up" => "rails/health#show", as: :rails_health_check
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  root "pages#home"

  # API endpoints
  namespace :api do
    namespace :v1 do
      # User info
      get "me", to: "users#me"

      # Projects CRUD
      resources :projects, only: [ :index, :show, :create, :update, :destroy ] do
        # Sections nested under projects
        resources :sections, only: [ :create, :update, :destroy ]
      end

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
