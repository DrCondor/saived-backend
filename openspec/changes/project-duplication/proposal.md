## Why

Interior designers frequently start new client projects from previously completed ones — similar apartments, recurring contractor lists, or standard furniture sets. Today there is no way to fork an existing project; designers must manually recreate sections and re-add every item. A "duplicate project" action lets the owner clone a project in one click and then customize the copy for the new client.

## What Changes

- New backend endpoint `POST /api/v1/projects/:id/duplicate` performs a deep-copy and returns the new project JSON in the same shape as `GET /api/v1/projects/:id`
- Deep-copy includes `section_groups`, `sections`, and `project_items` (with positions preserved) plus the per-item `ActiveStorage` attachment (re-attached as a new blob, not a shared reference)
- Excluded from copy: `ProductCaptureSample`, `ItemFavorite`, `ProjectMembership` (only a fresh `owner` membership for `current_user` is created)
- Duplicate is named `"Kopia: <original name>"`, owned by `current_user`, with `favorite: false` regardless of source
- The `Project#after_create :create_default_section` callback is suppressed during duplication so the duplicated sections aren't shadowed by an extra empty section
- Whole operation is wrapped in a single transaction — failure mid-way rolls back, no orphan records
- Authorization: only the project owner may duplicate. Non-owners get `403`; non-visible projects get `404`; unauthenticated requests get `401`
- Frontend: extend the existing sidebar right-click context menu with a "Duplikuj" entry, visible only when the project belongs to the current user (i.e., the user is the owner). On success, the workspace navigates to the new project
- Tests: Rails coverage for success path, attachment cloning, owner-only authorization, and transaction rollback; React coverage for the menu entry visibility and the duplicate mutation

### Alternatives considered

1. **`Project#duplicate_for(user)` model method instead of a service object** — keeps logic close to the model but mixes orchestration (membership creation, attachment cloning, callback suppression) into the model, which is already heavy. Rejected in favor of a dedicated `ProjectDuplicator` service for testability and clarity.
2. **Use Rails' `deep_cloneable` / `amoeba` gem** — would handle the deep copy automatically. Rejected: adds a dependency for a single usage, doesn't solve the `after_create :create_default_section` suppression problem, and gives less control over which associations are skipped (`ProductCaptureSample`, `ItemFavorite`, `ProjectMembership`).
3. **Trigger duplication via a header button or dropdown on the project page instead of sidebar right-click** — more discoverable but conflicts with the resolved PM decision (right-click on sidebar). Out of scope.
4. **Async job (Sidekiq) for the deep copy** — would protect against long-running requests for very large projects. Rejected: current projects are small (tens of items), and adding async UX (polling / toast on completion) is unnecessary complexity. Can be revisited if/when projects grow large.

### Out of scope (explicit)

- Duplication by non-owners (editors, viewers)
- Any entry point other than the sidebar right-click menu (no header button, no keyboard shortcut, no API-only ergonomics)
- Partial duplication (selecting which sections/items to copy)
- Bulk duplication of multiple projects at once
- Undo or soft-delete of duplicates
- Copying `ProductCaptureSample` or learning data
- Copying `ItemFavorite` records or sharing favorites with the source project
- Copying `ProjectMembership` records beyond the new owner
- PDF regeneration triggered by duplication
- Other right-click actions (Rename, Move, etc.) — only "Duplikuj" is added in this slice
- Renaming UX after duplication (user can use the existing rename flow if/when it exists; not added here)

## Capabilities

### New Capabilities

- `project-duplication`: Owner-initiated deep-copy of a project into a new owned project, including section groups, sections, items, and item attachments — with capture samples, favorites, and memberships explicitly excluded.

### Modified Capabilities

(none — pure additive endpoint and additive UI affordance)

## Acceptance criteria

- [ ] `POST /api/v1/projects/:id/duplicate` returns `201` with the new project JSON (same shape as `GET /api/v1/projects/:id`) for the owner
- [ ] Returns `401` without auth, `403` for non-owners (even if the user is a member), `404` if the project is not visible to `current_user`, `422` on validation failure
- [ ] Duplicated project name equals `"Kopia: <original name>"`
- [ ] Duplicated project `owner_id` equals `current_user.id`; a `ProjectMembership` with `role: "owner"` is created for `current_user`
- [ ] Duplicated project `favorite` is `false` regardless of source value
- [ ] All `section_groups`, `sections`, and `project_items` are present on the copy with positions preserved (relative ordering identical to source)
- [ ] Per-item fields copied verbatim: `name`, `note`, `quantity`, `unit_type`, `unit_price_cents`, `currency`, `category`, `dimensions`, `status`, `external_url`, `thumbnail_url`, `discount_label`, `discount_percent`, `discount_code`, `original_unit_price_cents`, `item_type`, `address`, `phone`
- [ ] When source item has an `ActiveStorage` attachment, the duplicate has its own attached blob (different `attachment.blob_id` or different blob `key`); downloading from the copy works after the source is destroyed
- [ ] No `ProductCaptureSample` rows are created or copied for the duplicated project
- [ ] No `ItemFavorite` rows are copied; the duplicated items have no favorite linkage
- [ ] No `ProjectMembership` rows beyond the new owner membership exist on the copy
- [ ] `Project#after_create :create_default_section` does NOT add an extra "Nowa sekcja" to the duplicate when source had at least one section
- [ ] Whole duplication is atomic — if any child save fails, no partial copy survives (verifiable via test that forces a failure mid-copy)
- [ ] Sidebar right-click menu shows a "Duplikuj" entry only when the project's `owner_id === currentUser.id` (or equivalent ownership check)
- [ ] Clicking "Duplikuj" calls the API, updates the projects list cache, and navigates to `/workspace/projects/:newId`
- [ ] Rails test coverage for: success path (counts of sections / items / attachments), attachment duplication is independent, owner-only authorization (non-owner member gets 403), transaction rollback on forced failure
- [ ] React test coverage for: "Duplikuj" entry hidden for non-owned project, click triggers mutation and navigation

## Risks

- **R1 (medium): ActiveStorage attachment cloning.** Naive `attachment.attach(item.attachment.blob)` shares the blob. Must use the project's existing pattern (`StringIO.new(@item.attachment.download)` — see `Api::V1::ProjectItemsController#duplicate`) to create an independent blob. Mitigation: explicit test that the duplicate's blob survives source destruction.
- **R2 (medium): `after_create :create_default_section` callback.** Must be suppressed during duplication or the copy ends up with an extra empty section preceding the cloned ones. Mitigation: skip via `Project.skip_callback` inside the service's transaction block, or use a thread-local / attr_accessor flag (`project.duplicating = true`) consulted by the callback. Test asserts section count equals source.
- **R3 (low): Public route addition.** New `POST /api/v1/projects/:id/duplicate` route. Pure additive, no breaking change, but flagged here per architect protocol.
- **R4 (low): Authorization drift.** Existing project endpoints scope through `current_user.projects` (membership), but duplicate must scope tighter — only `owner_id == current_user.id`. Test must assert that an editor/viewer member receives 403, not 200/404.
- **R5 (low): Position integrity.** Source positions might be sparse or have ties; the copy must preserve relative ordering, not necessarily exact integer values. Mitigation: copy `position` verbatim and rely on existing `order(:position, :created_at)` tiebreaker.
- **R6 (low): Large projects / request timeout.** A project with hundreds of items + attachments could cause a slow synchronous request. Acceptable for now (projects are small); flagged for future async refactor if needed.

No database migrations, no dependency additions, no third-party API calls.

## Impact

- **Backend**: new `app/services/project_duplicator.rb` (or equivalent), new `Api::V1::ProjectsController#duplicate` action, route addition in `config/routes.rb`, edit to `app/models/project.rb` to make the `create_default_section` callback skippable.
- **Frontend**: new `duplicateProject` API client function in `api/projects.ts`, new `useDuplicateProject` mutation hook in `hooks/useProjects.ts`, edits to `components/Layout/Sidebar.tsx` to add the "Duplikuj" menu entry with owner-gating, and an addition to `ProjectListItem` (or a derived ownership signal) so the sidebar can know whether the current user owns each project.
- **Types**: extend `ProjectListItem` and/or `Project` types in `app/javascript/workspace/types/index.ts` with whatever ownership signal is chosen (e.g., `is_owner: boolean` on the API responses, or `owner_id`).
- **API surface**: additive — `POST /api/v1/projects/:id/duplicate`. The list/show responses gain an ownership flag (additive, non-breaking).
- **Tests**: `test/controllers/api/v1/projects_controller_test.rb` (or a dedicated `projects_duplicate_test.rb`), a new service-level test for `ProjectDuplicator`, and a Sidebar/component test for the menu gating + mutation.
