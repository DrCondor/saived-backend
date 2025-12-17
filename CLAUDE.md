# CLAUDE.md - SAIVED Backend

## Project Overview

SAIVED is a cost estimate management tool for **interior designers** in the Polish market. It replaces spreadsheets with a streamlined workflow where designers can:
1. Browse e-commerce sites for furniture/products
2. Use a browser extension to capture product data
3. Organize products into projects and sections
4. Generate cost estimates (kosztorys) for clients

The backend serves two interfaces:
- **Web Dashboard** (`/workspace/*`) - Rails views with TailwindCSS
- **REST API** (`/api/v1/*`) - JSON endpoints for browser extension

## Tech Stack

- **Framework**: Ruby on Rails 7.2.3, Ruby 3.3.8
- **Database**: PostgreSQL 16 (Docker, port 5433)
- **Cache/Jobs**: Redis 7 (Docker, port 6380) - prepared for Sidekiq
- **Frontend**: TailwindCSS 4, ESBuild, Stimulus, Turbo
- **Auth**: Devise (sessions) + API tokens (bearer)
- **Testing**: Rails test framework, Capybara, Selenium

## Quick Commands

```bash
make dev          # Start everything (DB + Redis + Rails)
make prepare      # Setup database
make db-up        # Start PostgreSQL only
make redis-up     # Start Redis only
make console      # Rails console
make routes       # Show all routes
make test         # Run tests
```

## Data Model

```
User
 ├── api_token (for extension auth)
 ├── owned_projects (as owner)
 └── projects (via ProjectMembership)
      └── Project
           ├── owner_id → User
           ├── name, description
           ├── ProjectMembership (role-based access)
           └── ProjectSection (ordered by position)
                ├── name, position
                └── ProjectItem (ordered by position)
                     ├── name, note, quantity
                     ├── unit_price_cents, currency (PLN default)
                     ├── category, dimensions, status
                     ├── external_url, thumbnail_url, discount_label
                     └── ProductCaptureSample (for learning)
                          ├── raw_payload (scraped data)
                          ├── final_payload (user-corrected data)
                          └── context (selectors, domain, engine)
```

**Price Storage**: All prices stored as cents (`unit_price_cents`). Use `unit_price` getter/setter for decimal values.

## API Endpoints (for Extension)

All require `Authorization: Bearer {api_token}` header.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/projects` | List user's projects with sections |
| GET | `/api/v1/projects/:id` | Get project with sections and items |
| POST | `/api/v1/project_sections/:id/items` | Add item from extension |

**POST Item Payload**:
```json
{
  "product_item": {
    "name": "Chair",
    "quantity": 2,
    "unit_price": 299.99,
    "currency": "PLN",
    "external_url": "https://...",
    "thumbnail_url": "https://..."
  },
  "capture_context": {
    "url": "https://ikea.pl/...",
    "domain": "ikea.pl",
    "selectors": { "name": "h1.product-title", "price": ".price" },
    "html_samples": { "name": "<h1>...</h1>" },
    "engine": "heuristic-v1"
  },
  "original_product": { ... }
}
```

## Authentication

- **Web**: Devise sessions, redirects to `/users/sign_in`
- **API**: Bearer token in header, returns 401 if invalid
- **Token Generation**: Auto-generated via `has_secure_token :api_token`

## Project Roles

Defined in `ProjectMembership::ROLES`:
- `owner` - Full access (default)
- `editor` - Can modify
- `viewer` - Read only
- `client` - Client view (future)

Note: Role enforcement not fully implemented in controllers yet.

## Key Files

- `app/controllers/workspace/` - Web dashboard controllers
- `app/controllers/api/v1/` - Extension API controllers
- `app/models/` - All models
- `app/views/workspace/` - Dashboard ERB templates
- `config/routes.rb` - Route definitions
- `db/schema.rb` - Current database schema

## Current State & Known Issues

**Working**:
- User registration/login
- Project CRUD (create, read, update) - missing delete
- Section creation
- Item creation from extension
- Product capture sample logging

**Missing/TODO**:
- Delete project action
- Account settings page (profile menu, logout in top-right)
- Full CRUD for sections and items in web UI
- Role-based authorization enforcement
- Production deployment configuration

**Future Plans**:
- Migrate frontend to React/TypeScript for better UX
- Grammarly-style extension auth (auto-token transfer after login)
- Global learning system (selectors learned from all users per domain)
- Price update crawlers
- Sidekiq background jobs for async processing
- Real-time updates via WebSockets

## Learning System (ProductCaptureSample)

The `product_capture_samples` table stores:
- `raw_payload`: What the extension scraped automatically
- `final_payload`: What the user actually saved (may have corrections)
- `context`: Domain, URL, CSS selectors used, engine version

**Vision**: Compare raw vs final to learn which selectors work per domain. When many users correct the same field on the same domain, the system learns better selectors. Global learning benefits all users.

## Environment Variables

```bash
PGHOST=127.0.0.1
PGPORT=5433
PGUSER=postgres
PGPASSWORD=postgres
REDIS_URL=redis://127.0.0.1:6380/0
RAILS_ENV=development
```

## Polish Language

- UI is in Polish (target market)
- Code comments often in Polish
- Currency default: PLN
