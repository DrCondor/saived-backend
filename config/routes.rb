Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: "users/sessions",
    registrations: "users/registrations"
  }

  get "up" => "rails/health#show", as: :rails_health_check
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  root "pages#home"

  scope module: :workspace do
    get "/app", to: "dashboard#index", as: :dashboard
    resources :projects do
      resources :project_sections, path: "sections", only: [ :create, :update ]
    end

    resources :project_sections, only: [] do
      resources :project_items, path: "items", only: [ :create, :destroy ]
    end
  end
end
