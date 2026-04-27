# Design: project-duplication

**Status:** Gate 1 approved. PM has resolved all open questions. This document
finalizes the technical contract for implementation.

**Source:** `proposal.md`, `source-trello.md`
**Trello card:** [T11HZIJ9](https://trello.com/c/T11HZIJ9)

---

## 1. Decisions resolved at Gate 1

The proposal flagged three non-blocking open questions. PM answered each:

1. **Item attribute whitelist (Q1).** The Trello card's field list is
   illustrative, not exhaustive. The implementation SHALL copy every
   "descriptive item data" column on `project_items`. Concretely, the copy
   whitelist is:

       item_type, name, note, quantity, unit_type,
       unit_price_cents, currency,
       original_unit_price_cents, discount_label, discount_percent, discount_code,
       category, dimensions, status, position,
       external_url, thumbnail_url,
       phone, address

   Excluded from the copy (per "user-personal or capture-event-bound"):
   - `id`, `created_at`, `updated_at` (Rails will assign)
   - `project_section_id` (set to the new section's id)
   - `deleted_at` (always nil — soft-deleted items are not copied at all)
   - ActiveStorage `attachment` blobs (PM: out of scope for v1)
   - `ItemFavorite` rows (per-user state)
   - `ProductCaptureSample` rows (capture-event-bound)

2. **Sidebar owner-check data (Q2).** The `projects#index` JSON SHALL include
   an `is_owner: boolean` field on each project, computed as
   `current_user.id == project.owner_id`. The same field SHOULD be added to
   `projects#show` JSON for consistency. Frontend uses `is_owner` directly
   (no `currentUser.id` comparison needed; no extra request).

3. **`Project#position` on the duplicate (Q3).** `projects.position` is a
   nilable integer column (see schema). The duplicate's `position` SHALL be
   left at the Rails default (`nil`). It is NOT copied from the source. The
   existing `current_user.projects.order(:position, :created_at)` ordering
   in `ProjectsController#index` puts nil-position projects after
   non-nil-position ones in PostgreSQL's default `NULLS LAST` ordering for
   ASC sorts (and ties are broken by `created_at`), so the duplicate
   naturally appears at the end of the user's list — matching "fresh
   project" intuition.

---

## 2. Architecture

### 2.1 Components

```
React Sidebar context menu
        │ click "Duplikuj projekt"
        ▼
useDuplicateProject (TanStack Query mutation)
        │ POST /api/v1/projects/:id/duplicate
        ▼
Api::V1::ProjectsController#duplicate
        │ - Find project (404 if absent)
        │ - Authorize: owner-only (403 if not owner)
        │ - Delegate to service
        ▼
Projects::Duplicator#call
        │ Single ActiveRecord::Base.transaction:
        │   1. Set Thread.current[:saived_skip_default_section] = true
        │   2. Build new Project (owner=current_user, name="<src> (kopia)")
        │   3. Save → after_create callback no-ops due to thread flag
        │   4. Create owner ProjectMembership
        │   5. Copy active SectionGroups → build group_id_map
        │   6. Copy active Sections (mapping section_group_id) → section_id_map
        │   7. Copy active Items per section (verbatim attributes incl. position)
        │   8. ensure { Thread.current[...] = nil }
        │ Returns the new Project
        ▼
Controller renders project_json(new_project), status 201
        ▼
Frontend invalidates ['projects'] and navigates to /workspace/projects/:new_id
```

### 2.2 Files touched

| File | Change | Est. LOC |
|------|--------|----------|
| `config/routes.rb` | add `post :duplicate, on: :member` to `resources :projects` | +1 |
| `app/controllers/api/v1/projects_controller.rb` | add `#duplicate` action; add `is_owner` to index/show JSON | +25 |
| `app/services/projects/duplicator.rb` | new service object | +120 |
| `app/models/project.rb` | guard `create_default_section` against the thread flag | +3 |
| `app/javascript/workspace/types/index.ts` | add `is_owner: boolean` to `ProjectListItem` and `Project` | +2 |
| `app/javascript/workspace/api/projects.ts` | add `duplicateProject(id)` | +5 |
| `app/javascript/workspace/hooks/useProjects.ts` | add `useDuplicateProject` hook | +20 |
| `app/javascript/workspace/components/Layout/Sidebar.tsx` | new menu entry, gated on `is_owner` | +35 |
| `test/services/projects/duplicator_test.rb` | unit tests | +180 |
| `test/controllers/api/v1/projects_controller_test.rb` | controller tests for `duplicate` and `is_owner` JSON | +90 |
| `app/javascript/workspace/components/Layout/Sidebar.test.tsx` | duplicate menu entry tests | +60 |

**Total estimate:** ~540 LOC, of which ~330 is tests. Production code:
~210 LOC. Above the 300 LOC trigger; per proposal Section 8 we accept this
as a single slice because backend + frontend land together (no dead
endpoint).

### 2.3 No migration

`projects.position` already exists. `is_owner` is a derived field on the
JSON response only — not a column. No `db/migrate/*` files in this change.

---

## 3. Service object: `Projects::Duplicator`

### 3.1 Public interface

```ruby
# app/services/projects/duplicator.rb
module Projects
  class Duplicator
    def initialize(source_project, current_user)
      @source = source_project
      @user = current_user
    end

    # Returns the new Project (already persisted).
    # Raises ActiveRecord::RecordInvalid on validation failure
    # (caller should rescue and translate to HTTP 422 if needed).
    def call
      ActiveRecord::Base.transaction do
        with_default_section_suppressed do
          new_project = build_project
          new_project.save!
          create_owner_membership(new_project)
          group_id_map = copy_section_groups(new_project)
          copy_sections_and_items(new_project, group_id_map)
          new_project
        end
      end
    end

    private

    def with_default_section_suppressed
      Thread.current[:saived_skip_default_section] = true
      yield
    ensure
      Thread.current[:saived_skip_default_section] = nil
    end

    def build_project
      @user.owned_projects.new(
        name: "#{@source.name} (kopia)",
        description: @source.description,
        favorite: false,
        position: nil
      )
    end

    def create_owner_membership(project)
      ProjectMembership.create!(project: project, user: @user, role: "owner")
    end

    def copy_section_groups(new_project)
      map = {}
      @source.section_groups.each do |group|  # default scope is active + ordered
        new_group = new_project.section_groups.create!(
          name: group.name,
          position: group.position
        )
        map[group.id] = new_group.id
      end
      map
    end

    def copy_sections_and_items(new_project, group_id_map)
      @source.sections.includes(:items).each do |section|
        new_section = new_project.sections.create!(
          name: section.name,
          position: section.position,
          section_group_id: section.section_group_id ? group_id_map[section.section_group_id] : nil
        )
        section.items.each do |item|  # `items` scope is already active + ordered
          new_item = ProjectItem.new(item.attributes.slice(*ITEM_COPY_ATTRIBUTES))
          new_item.project_section = new_section
          new_item.save!
        end
      end
    end

    ITEM_COPY_ATTRIBUTES = %w[
      item_type name note quantity unit_type
      unit_price_cents currency
      original_unit_price_cents discount_label discount_percent discount_code
      category dimensions status position
      external_url thumbnail_url
      phone address
    ].freeze
  end
end
```

### 3.2 Why these primitives

- **`ActiveRecord::Base.transaction`** — atomicity per AC #13 / R3.
- **Thread-local flag** (R1) — process-global `skip_callback` is unsafe in
  multi-threaded servers (Puma). Thread-local is per-request and naturally
  cleaned up by the `ensure` block.
- **`ProjectItem.new` + `save!`** rather than `insert_all` (R2) — we want
  validations to run AND `before_create :set_position` must be a no-op for
  copied items. `set_position` early-returns when
  `position.present? && position != 0`. We pass `position` verbatim from
  the source. **Edge case:** if a source item somehow has `position == 0`,
  `set_position` will recompute it. This matches existing behavior because
  `position` defaults to `0` in the schema, but normal items always end up
  with non-zero positions due to the same callback. Tests cover positive,
  negative, and zero source positions.
- **`@source.sections` and `@source.section_groups`** — both default-scoped
  to `active` (i.e. `where(deleted_at: nil)`), so soft-deleted records are
  automatically excluded per AC #7 / #9 / source-trello AC line 22.
- **`section.items`** — also default-scoped to `active.order(position: :asc)`
  per `ProjectSection#items` association.

### 3.3 Project model change

```ruby
# app/models/project.rb
def create_default_section
  return if Thread.current[:saived_skip_default_section]
  sections.create!(name: "Nowa sekcja", position: 1)
end
```

This is the **only** change to `Project`. The flag name is namespaced
(`saived_`) so it cannot collide with library code.

---

## 4. Controller: `Api::V1::ProjectsController#duplicate`

### 4.1 Action

```ruby
# POST /api/v1/projects/:id/duplicate
def duplicate
  project = Project.find(params[:id])

  unless project.owner_id == current_user.id
    return render json: { error: "Forbidden" }, status: :forbidden
  end

  new_project = Projects::Duplicator.new(project, current_user).call
  render json: project_json(new_project), status: :created
rescue ActiveRecord::RecordNotFound
  render json: { error: "Not found" }, status: :not_found
rescue ActiveRecord::RecordInvalid => e
  render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
end
```

### 4.2 Why find on `Project` (not scoped)

If we used `current_user.projects.find(params[:id])`, an editor/viewer
member would get the project (they're in `users` through
`project_memberships`) and be unable to distinguish 404 from 403. By
finding on the global `Project` and checking `owner_id` explicitly:

- Non-existent id → `RecordNotFound` → 404
- Project belongs to a different organization (no membership) → also
  `RecordNotFound` IF we used the scope. But on global `Project.find` we
  WILL find it. That is a leak: a user could discover that a project ID
  exists. **Mitigation:** check membership existence too, returning 404 if
  the user is neither owner nor member, 403 if they are a non-owner
  member. Final logic:

  ```ruby
  project = Project.find(params[:id])
  is_member = project.users.exists?(id: current_user.id)
  if !is_member
    raise ActiveRecord::RecordNotFound  # foreign project → 404
  elsif project.owner_id != current_user.id
    return render json: { error: "Forbidden" }, status: :forbidden
  end
  ```

  This matches AC #2 (403 for editor/viewer) and AC #3 (404 for foreign).

### 4.3 `is_owner` JSON field

In both `index` and `project_json` (used by `show`, `create`, `update`,
`reorder`, and now `duplicate`), add:

```ruby
is_owner: project.owner_id == current_user.id
```

`project_json` already references `current_user.id` indirectly via
`favorite_item_ids`, so this is a trivially safe addition.

---

## 5. Frontend

### 5.1 Types

```ts
// app/javascript/workspace/types/index.ts
export interface ProjectListItem {
  // ... existing fields ...
  is_owner: boolean;  // NEW
}

export interface Project {
  // ... existing fields ...
  is_owner: boolean;  // NEW
}
```

### 5.2 API helper + hook

```ts
// app/javascript/workspace/api/projects.ts
export async function duplicateProject(id: number): Promise<Project> {
  return apiFetch(`/api/v1/projects/${id}/duplicate`, { method: 'POST' });
}
```

```ts
// app/javascript/workspace/hooks/useProjects.ts
export function useDuplicateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => duplicateProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
```

### 5.3 Sidebar menu

In `Sidebar.tsx`, the context menu (lines 866-913) currently has:
1. "Dodaj/Usuń z ulubionych" button
2. divider
3. "Usuń projekt" button

Insert "Duplikuj projekt" between (1) and (2), gated on
`contextMenuProject.is_owner`. The handler:

```ts
const duplicateProject = useDuplicateProject();
const handleDuplicateProject = useCallback(() => {
  if (!contextMenu.projectId) return;
  duplicateProject.mutate(contextMenu.projectId, {
    onSuccess: (newProject) => {
      navigate(`/workspace/projects/${newProject.id}`);
    },
  });
  setContextMenu((prev) => ({ ...prev, visible: false }));
}, [contextMenu.projectId, duplicateProject, navigate]);
```

Render guard: `{contextMenuProject.is_owner && (<button …>Duplikuj projekt</button>)}`.

---

## 6. Test plan

Driven by the implementer via `/saived:tdd`. Categories below; specifics
in the spec scenarios (specs/).

### 6.1 Service unit (`test/services/projects/duplicator_test.rb`)

- happy path: project with 2 groups, 4 sections, 10 items duplicates 1:1
- soft-deleted section excluded from copy
- soft-deleted item excluded from copy
- `ProductCaptureSample` not copied
- `ItemFavorite` not copied
- `ProjectMembership` of non-owner not copied
- default section NOT created on the duplicate
- thread flag cleared after `call` (even on raise)
- thread flag cleared on validation failure
- contractor with negative position preserved verbatim
- ActiveStorage attachment NOT copied
- `discount_percent`, `discount_code`, `original_unit_price_cents` copied
- `section_group_id` correctly remapped (sections point at NEW groups)
- atomicity: forced raise after first item creation → zero new rows

### 6.2 Controller (`test/controllers/api/v1/projects_controller_test.rb`)

- 201 + new project JSON for owner
- 401 unauth
- 403 for editor member
- 403 for viewer member
- 404 for foreign project (no membership)
- 404 for non-existent id
- response includes `is_owner: true` on owned projects in `index`
- response includes `is_owner: false` on member-only projects in `index`

### 6.3 Frontend (`Sidebar.test.tsx`)

- "Duplikuj projekt" entry visible when `is_owner === true`
- "Duplikuj projekt" entry NOT visible when `is_owner === false`
- click triggers `useDuplicateProject` mutation
- on success, `navigate` is called with `/workspace/projects/${new.id}`

---

## 7. Risk register (final)

Inherited from proposal Section 6 with status updates:

| ID | Status | Notes |
|----|--------|-------|
| R1 (callback suppression) | RESOLVED | Thread-local flag in `Project#create_default_section`. |
| R2 (negative positions) | RESOLVED | Use `new` + `save!`; rely on `set_position` early-return. Test covers `-2`. |
| R3 (atomicity) | RESOLVED | Single `transaction`; explicit forced-failure test. |
| R4 (new public route) | ACCEPTED | Same security envelope as `toggle_favorite`. Owner-check explicit. No migration, no dependency, no third-party call. |
| R5 (large project synchronous) | DEFERRED | TODO comment in service; ticket if profiling shows >5s in production. |
| R6 (frontend owner data) | RESOLVED | `is_owner` field added to JSON (Decision Q2). |
| R7 (group id mapping) | MITIGATED | Single-pass map build inside service; covered by AC #8 service test. |

---

## 8. What this design explicitly does NOT do

(Restated from proposal Section 3 for the implementer's benefit.)

- No copy of ActiveStorage `attachment` blobs.
- No copy of `ProductCaptureSample`, `ItemFavorite`, or non-owner
  `ProjectMembership`.
- No copy of soft-deleted records (filter via `.active` scopes).
- No naming modal — auto-named only.
- No editor/viewer access — owner-only.
- No async/Sidekiq path.
- No selector-learning re-run.
- No PDF generator changes.
- No DB migration (uses existing columns).
