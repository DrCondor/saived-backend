# CLAUDE.md - SAIVED Backend

## Project Overview

SAIVED is a cost estimate management tool for **interior designers** in the Polish market. It replaces spreadsheets with a streamlined workflow where designers can:
1. Browse e-commerce sites for furniture/products
2. Use a browser extension to capture product data
3. Organize products into projects and sections
4. Generate cost estimates (kosztorys) for clients

The backend serves two interfaces:
- **Web Dashboard** (`/workspace/*`) - React SPA with TypeScript
- **REST API** (`/api/v1/*`) - JSON endpoints for browser extension + SPA

## Tech Stack

- **Framework**: Ruby on Rails 7.2.3, Ruby 3.3.8
- **Database**: PostgreSQL 16 (Docker, port 5433)
- **Cache/Jobs**: Redis 7 (Docker, port 6380) - prepared for Sidekiq
- **Frontend**: React 19, TypeScript, TanStack Query, React Router 6, TailwindCSS 4, ESBuild
- **Auth**: Devise (sessions for SPA) + API tokens (bearer for extension)
- **Testing**: Minitest + FactoryBot (Rails), Vitest + React Testing Library (React), Jest (Extension)

## Quick Commands

```bash
make dev          # Start everything (DB + Redis + Rails)
make prepare      # Setup database
make db-up        # Start PostgreSQL only
make redis-up     # Start Redis only
make console      # Rails console
make routes       # Show all routes
make test         # Run Rails tests

yarn build        # Build React SPA + application.js
yarn build:css    # Build TailwindCSS
yarn test         # Run React tests (watch mode)
yarn test:run     # Run React tests (single run)
```

## Deployment

- **Platform**: Fly.io
- **Deploy command**: `fly deploy`
- **Deploy after pushing**: Always deploy with `fly deploy` after pushing to main

## Data Model

```
Organization
 ├── name (company name)
 ├── nip (tax ID)
 ├── phone (company phone)
 ├── company_info (rich text HTML for PDF header)
 └── logo (ActiveStorage attachment)

User
 ├── api_token (for extension auth)
 ├── organization_id → Organization (company data for PDFs)
 ├── owned_projects (as owner)
 ├── projects (via ProjectMembership)
 └── item_favorites → ItemFavorite → ProjectItem (favorite items)
      └── Project
           ├── owner_id → User
           ├── name, description
           ├── ProjectMembership (role-based access)
           └── ProjectSection (ordered by position)
                ├── name, position
                └── ProjectItem (ordered by position)
                     ├── item_type: product | contractor | note
                     ├── name, note, quantity
                     ├── unit_price_cents, currency (PLN default)
                     ├── category, dimensions, status
                     ├── external_url, thumbnail_url, discount_label
                     ├── phone, address, attachment_url (contractor fields)
                     └── ProductCaptureSample (for learning)
                          ├── raw_payload (scraped data)
                          ├── final_payload (user-corrected data)
                          └── context (selectors, domain, engine)

DomainSelector (global learning)
 ├── domain (e.g., "ikea.pl")
 ├── field_name (name, price, thumbnail_url)
 ├── selector (CSS selector)
 ├── success_count, failure_count
 └── confidence (calculated Wilson score)
```

**Price Storage**: All prices stored as cents (`unit_price_cents`). Use `unit_price` getter/setter for decimal values.

**Item Types** (`ProjectItem.item_type`):
| Type | Purpose | Fields Used | Counts in Sum |
|------|---------|-------------|---------------|
| `product` | Furniture, materials from e-commerce | All fields, captured via extension | Yes |
| `contractor` | Service providers (painters, electricians) | name, phone, address, unit_price, attachment_url | Yes |
| `note` | Text annotations for client communication | name (optional title), note (content) | No |

Notes are for informing clients about additional context, e.g., "Below are 3 tile options for the bathroom walls..."

## API Endpoints

API supports both Bearer token (extension) and session auth (SPA).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/me` | Current user info (includes organization) |
| PATCH | `/api/v1/me/organization` | Update organization data (name, nip, phone, company_info) |
| GET | `/api/v1/projects` | List user's projects with sections |
| GET | `/api/v1/projects/:id` | Get project with sections and items |
| POST | `/api/v1/projects` | Create project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| POST | `/api/v1/projects/:id/sections` | Create section |
| PATCH | `/api/v1/projects/:id/sections/:id` | Update section |
| DELETE | `/api/v1/projects/:id/sections/:id` | Delete section |
| POST | `/api/v1/project_sections/:id/items` | Add item |
| PATCH | `/api/v1/project_sections/:id/items/:id` | Update item |
| DELETE | `/api/v1/project_sections/:id/items/:id` | Delete item |
| GET | `/api/v1/selectors?domain=...` | Get learned selectors for domain |
| GET | `/api/v1/favorites` | List user's favorite items |
| POST | `/api/v1/favorites/:project_item_id` | Add item to favorites |
| DELETE | `/api/v1/favorites/:project_item_id` | Remove item from favorites |

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

- **SPA (React)**: Devise sessions with CSRF token, redirects to `/users/sign_in` if not logged in
- **Extension**: Bearer token in `Authorization` header
- **API**: Supports both session auth (SPA) and Bearer token (extension)
- **Token Generation**: Auto-generated via `has_secure_token :api_token`

The `Api::V1::BaseController` tries Bearer token first, falls back to session auth.

## Project Roles

Defined in `ProjectMembership::ROLES`:
- `owner` - Full access (default)
- `editor` - Can modify
- `viewer` - Read only

Note: Role enforcement not fully implemented in controllers yet. Clients receive PDF exports only (no app access).

## Key Files

### Backend (Rails)
- `app/controllers/api/v1/` - API controllers (projects, sections, items, users, selectors)
- `app/controllers/workspace/spa_controller.rb` - Serves React SPA shell
- `app/views/workspace/spa/index.html.erb` - React SPA HTML template
- `app/models/` - All models
- `config/routes.rb` - Route definitions
- `db/schema.rb` - Current database schema

### Frontend (React SPA)
```
app/javascript/workspace/
├── index.tsx                 # Entry point
├── App.tsx                   # Router + QueryClientProvider
├── api/
│   ├── client.ts            # Fetch wrapper with CSRF + session auth
│   ├── projects.ts          # Project API functions
│   ├── sections.ts          # Section API functions
│   ├── items.ts             # Item API functions
│   └── favorites.ts         # Favorites API functions
├── hooks/
│   ├── useProjects.ts       # TanStack Query hooks for projects
│   ├── useProject.ts        # Single project hook
│   ├── useSections.ts       # Section mutations
│   ├── useItems.ts          # Item mutations
│   ├── useFavorites.ts      # Favorites query + toggle mutation
│   └── useCurrentUser.ts    # Current user from window.__INITIAL_DATA__
├── components/
│   ├── Layout/
│   │   ├── Layout.tsx       # Main layout with Header
│   │   ├── Header.tsx       # Top header with user dropdown
│   │   └── Sidebar.tsx      # Projects list sidebar
│   └── Project/
│       ├── ProjectView.tsx       # Full project view with sections
│       ├── Section.tsx           # Section with inline name editing
│       ├── ItemCard.tsx          # Item card (grid view)
│       ├── ItemCardCompact.tsx   # Item card (list view)
│       ├── ItemCardMoodboard.tsx # Item card (moodboard view)
│       ├── SortableItemCard*.tsx # Drag-wrapper components (dnd-kit)
│       └── AddItemForm.tsx       # Form for adding product/contractor/note
├── pages/
│   ├── WorkspacePage.tsx    # Main workspace page
│   ├── NewProjectPage.tsx   # New project form
│   └── FavoritesPage.tsx    # Favorites page (grid of favorited items)
├── types/
│   └── index.ts             # TypeScript interfaces
└── utils/
    └── formatters.ts        # formatCurrency, getStatusLabel, etc.
```

## Routes

### React SPA Routes (client-side)
| Path | Component | Purpose |
|------|-----------|---------|
| `/workspace` | `WorkspacePage` | Main workspace (redirects to first project) |
| `/workspace/projects/new` | `NewProjectPage` | Create new project form |
| `/workspace/projects/:id` | `WorkspacePage` | View specific project |
| `/workspace/favorites` | `FavoritesPage` | View all favorited items |

### Rails Routes
| Helper | Path | Purpose |
|--------|------|---------|
| `workspace_path` | `/workspace` | React SPA entry point |
| `workspace_path` | `/workspace/*` | Catch-all for SPA client routing |

## Current State & Known Issues

**Working**:
- User registration/login
- React SPA workspace with full CRUD for projects, sections, items
- Three item types: product, contractor, note
- Drag & drop reordering (items within/across sections) via dnd-kit
- Account dropdown with settings, API token copy, logout
- Account settings page (change email/password)
- Inline section name editing
- Item creation and deletion (web UI + extension)
- Product capture sample logging
- API supports both session auth (SPA) and Bearer token (extension)
- Section collapsed state persisted in localStorage
- Three view modes: grid, list (compact), moodboard
- **Favorites** - add items to favorites via heart icon, view on `/workspace/favorites` page

**Missing/TODO**:
- Item editing in web UI (currently only via extension re-capture)
- Drag & drop reordering for sections
- Role-based authorization enforcement
- Bundle size optimization (currently 1.2MB unminified)

**Future Plans**:
- Grammarly-style extension auth (auto-token transfer after login)
- Global learning system (selectors learned from all users per domain)
- Price update crawlers
- Sidekiq background jobs for async processing
- Real-time updates via WebSockets

## Learning System

The learning system analyzes user corrections to improve scraping accuracy over time.

### Data Model

```
DomainSelector
 ├── domain (e.g., "ikea.pl")
 ├── field_name (name, price, thumbnail_url)
 ├── selector (CSS selector)
 ├── success_count (times selector worked)
 ├── failure_count (times user corrected)
 └── confidence (Wilson score interval)

ProductCaptureSample
 ├── raw_payload (scraped data from extension)
 ├── final_payload (user-saved data, may have corrections)
 └── context (selectors used, domain, engine version)
```

### How It Works

1. **Data Collection**: When a user saves a product from the extension, both `raw_payload` (what was scraped) and `final_payload` (what user saved) are stored in `ProductCaptureSample`.

2. **Analysis**: `AnalyzeCaptureSampleJob` runs after each sample is created:
   - Compares raw vs final values for each field
   - If values match = **success** (selector worked correctly)
   - If values differ = **failure** (user had to correct it)

3. **Confidence Scoring**: `DomainSelector` uses Wilson score interval for confidence:
   - Handles small sample sizes well
   - Selectors need 3+ successes and 70%+ confidence to be "reliable"

4. **Extension Integration**:
   - Extension fetches `GET /api/v1/selectors?domain=ikea.pl`
   - Returns best selectors per field: `{ name: "h1.title", price: ".price-box" }`
   - Extension tries learned selectors first, falls back to heuristics

### Key Files

- `app/models/domain_selector.rb` - Selector storage and confidence scoring
- `app/jobs/analyze_capture_sample_job.rb` - Background analysis job
- `app/controllers/api/v1/selectors_controller.rb` - API endpoint for fetching selectors

### API Endpoint

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/v1/selectors?domain=ikea.pl` | Get best learned selectors for domain |

**Response**:
```json
{
  "domain": "ikea.pl",
  "selectors": {
    "name": "h1.product-title",
    "price": ".price-value"
  },
  "stats": {
    "total_selectors": 5,
    "total_samples": 23,
    "fields": [...]
  }
}
```

### Engine Types

The `context.engine` field tracks how data was scraped:
- `heuristic-v1` - Used default heuristic selectors (og:tags, largest h1, etc.)
- `learned-v1` - Used learned selectors from backend

## Environment Variables

```bash
PGHOST=127.0.0.1
PGPORT=5433
PGUSER=postgres
PGPASSWORD=postgres
REDIS_URL=redis://127.0.0.1:6380/0
RAILS_ENV=development
```

## Testing

### MANDATORY: Always Write Tests

**CRITICAL RULE**: When implementing new features, ALWAYS write tests:

1. **API Endpoints (Rails)**: Every new endpoint MUST have tests covering:
   - Success cases (200/201)
   - Authentication (401 without auth)
   - Authorization (403 for wrong user)
   - Validation errors (422)
   - Not found cases (404)

2. **Frontend Components (React)**: New components MUST have tests for:
   - Basic rendering
   - User interactions (clicks, inputs)
   - Edge cases (empty states, loading states)

3. **Hooks (React)**: New hooks MUST have tests for:
   - Initial state
   - State changes after actions
   - Error handling

4. **Use TDD when possible**: Use `superpowers:test-driven-development` skill - write tests BEFORE implementation.

5. **Don't skip tests "for speed"**: Technical debt from missing tests WILL bite us later.

### Running Tests

```bash
# Backend (Rails) - requires PostgreSQL running
make test
# or manually:
PGHOST=127.0.0.1 PGPORT=5433 PGUSER=postgres PGPASSWORD=postgres bin/rails test

# React SPA (Vitest)
yarn test          # Watch mode - re-runs on file changes
yarn test:run      # Single run - for CI

# Extension (Jest) - run from saived-extension directory
cd ../saived-extension
npm test           # Watch mode
npm run test:coverage  # With coverage
```

### Test Structure

```
test/
├── factories/           # FactoryBot factories
│   ├── users.rb
│   ├── projects.rb
│   ├── project_sections.rb
│   ├── project_items.rb
│   ├── domain_selectors.rb
│   └── product_capture_samples.rb
├── models/              # Model unit tests
│   ├── domain_selector_test.rb    # Wilson score, confidence
│   ├── project_item_test.rb       # Price conversion
│   ├── user_test.rb               # Profile helpers
│   └── ...
├── controllers/
│   └── api/v1/          # API integration tests
│       ├── projects_controller_test.rb
│       ├── sections_controller_test.rb
│       ├── project_items_controller_test.rb
│       ├── selectors_controller_test.rb
│       └── users_controller_test.rb
└── fixtures/files/      # Test files (avatars, etc.)

app/javascript/workspace/
├── tests/
│   ├── setup.ts         # Vitest setup, mocks
│   └── test-utils.tsx   # Render wrapper with providers
├── utils/
│   └── formatters.test.ts
├── components/shared/
│   └── StatusSelect.test.tsx
└── hooks/
    └── useProjects.test.tsx
```

### Test Counts

| Suite | Tests | Coverage |
|-------|-------|----------|
| Rails (all) | 224 | ~7% |
| React Components | 13 | - |
| React Hooks | 5 | - |
| React Utils | 19 | - |
| **Total** | **261** | - |

### Writing Tests

**Rails (Minitest)**:
```ruby
# Use factories instead of fixtures
test "creates project" do
  user = create(:user)
  project = create(:project, owner: user)
  assert_equal user, project.owner
end

# API tests with auth
test "returns 401 without auth" do
  get api_v1_projects_path
  assert_response :unauthorized
end

test "lists projects with auth" do
  get api_v1_projects_path, headers: auth_headers(@user)
  assert_response :success
end
```

**React (Vitest)**:
```tsx
import { render, screen, fireEvent } from '../tests/test-utils';
import { describe, it, expect, vi } from 'vitest';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### CI/CD

Both repos have GitHub Actions CI:

**Backend** (`.github/workflows/ci.yml`):
- Brakeman security scan
- Rubocop linting
- Minitest with PostgreSQL service

**Extension** (`saived-extension/.github/workflows/ci.yml`):
- Jest tests with coverage
- Syntax validation

## Current Work (updated 2026-01-26)

**Recently completed (ready to deploy)**:
- **Ulubione (Favorites)** - heart icon on item cards to add/remove favorites
  - Backend: `ItemFavorite` model, `item_favorites` table, `FavoritesController`
  - Frontend: heart button on all 3 card views, `/workspace/favorites` page, sidebar link
  - API: GET/POST/DELETE `/api/v1/favorites/:project_item_id`

**Previously completed & deployed**:
- NOTATKA (note) - third item type for text-only annotations
- Wykonawca (contractor) - item type with phone, address fields
- Drag & drop items (within/across sections) via dnd-kit
- Section collapsed state (persisted in localStorage)
- Editable project description (for PDF "Notatka" field)
- Three view modes: grid, list, moodboard
- List view layout fixes (price column width, quantity nowrap, category width)

**Pending/TODO from Trello**:
- PDF export needs update to render notes as text blocks (not in price table)
- Check Trello board for new tickets after Martyna's testing

**Technical notes**:
- Notes use existing `name` and `note` fields, no migration needed
- `total_price` returns 0 for notes (doesn't affect sums)
- Contractors insert at beginning of section, products/notes at end
- Favorites use join table `item_favorites` (user_id, project_item_id)

## Trello Integration

Project board: https://trello.com/b/RcSFyPfW/saived-trello
Board ID: `6963562a6d9c4475295fc205`

**API Credentials**: Stored in `~/.trello_credentials` (not in repo)

**Common operations**:
```bash
# Load credentials
source ~/.trello_credentials  # exports TRELLO_KEY and TRELLO_TOKEN

# List boards
curl "https://api.trello.com/1/members/me/boards?key=$TRELLO_KEY&token=$TRELLO_TOKEN"

# Get lists on SAIVED board
curl "https://api.trello.com/1/boards/KOH1DLOH/lists?key=$TRELLO_KEY&token=$TRELLO_TOKEN"

# Get cards in a list
curl "https://api.trello.com/1/lists/LIST_ID/cards?key=$TRELLO_KEY&token=$TRELLO_TOKEN"

# Move card to list and assign member
curl -X PUT "https://api.trello.com/1/cards/CARD_ID?idList=LIST_ID&idMembers=MEMBER_ID&key=$TRELLO_KEY&token=$TRELLO_TOKEN"
```

**Key list IDs**:
- "To Do": `6963562a6d9c4475295fc1fc`
- "In Progress": `6963562a6d9c4475295fc1fa`
- "W testach (Marti)": `6964dd6e9d788f26972164d7`
- "Done": `6963562a6d9c4475295fc1f8`
- "Sugestie": `6963562a6d9c4475295fc1ff`

**Member IDs**:
- Martyna Budnik: `6963aca15b7fa5b787bf2e9c`

## Polish Language

- UI is in Polish (target market)
- Code comments often in Polish
- Currency default: PLN

## AI-driven workflow

This repo uses Claude Code as the primary code-production mechanism. The setup is documented in detail in `docs/superpowers/specs/2026-04-26-ai-ecosystem-design.md`. Quick reference:

### Subagents (`.claude/agents/`)
- `architect` (opus) — writes opsx specs, never code
- `implementer` (sonnet) — writes code under TDD, never specs
- `reviewer` (opus) — read-only PR review via `gh`
- `debugger` (sonnet) — invoked on stuck/failing tests, systematic methodology
- `qa-tester` (sonnet) — adds tests, never edits prod code

### Plugins
- `opsx` — OpenSpec workflow (existing)
- `sdlc` — TDD, PR (with dynamic checklist), parallel, verification, retro, debug
- `trellosync` — start, ship, backlog, comment

### MCP servers
- `trello` — `tooling/trello-mcp/`, project-scoped via `.mcp.json`. Requires `TRELLO_KEY` and `TRELLO_TOKEN` in shell env (sourced from `~/.trello_credentials`).

### Workflow

1. `/trellosync:backlog` → see "To Do"
2. `/trellosync:start <CARD_ID>` → branch + opsx scaffold + card moved
3. **architect** → /opsx:explore + /opsx:propose → human reviews proposal (Gate 1)
4. **implementer** → /sdlc:tdd + /opsx:apply → human reviews diff (Gate 2)
5. /sdlc:verification → all gates green
6. /sdlc:pr → PR with dynamic checklist
7. **reviewer** triggered via `@claude` PR comment
8. Human ticks pre-merge checklist + merges (Gate 3)
9. CI: trello-sync.yml moves card to Done; deploy.yml ships to Fly.io
10. Human ticks post-merge checklist (Gate 4)
11. /opsx:archive + optional /sdlc:retro

### Guardrails

- `.claude/settings.json` — allow/deny permissions
- `.claude/hooks/pre_bash_guard.sh` — blocks destructive commands
- `.claude/hooks/audit_log.sh` — every tool call logged to `.claude/logs/`

### Onboarding

Run `/opsx:onboard` for a guided walkthrough. Read this section, then read the design spec.
