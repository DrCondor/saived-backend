# Proposal: project-duplication

**Status:** READY-FOR-REVIEW (Gate 1)
**Trello card:** [T11HZIJ9](https://trello.com/c/T11HZIJ9)
**Branch:** `feat/project-duplication`
**Source spec:** `openspec/changes/project-duplication/source-trello.md`

---

## 1. Motivation

Designers regularly start new projects from a similar past one (same client,
same template scope, recurring section structure). Today the only options are
rebuilding from scratch or recapturing items via the extension — both are
high-friction and discourage reuse. The card asks for a one-click duplicate
that preserves the structural skeleton (sections, groups, items) and gives the
designer a fresh, independently editable project.

PM has resolved every open question on the source card (auto-name, owner-only,
sidebar context menu, no attachments, single transaction). This proposal turns
those decisions into a concrete implementation contract.

---

## 2. Scope (in)

### Backend

- New route: `POST /api/v1/projects/:id/duplicate` (member route on the
  existing `resources :projects` block in `config/routes.rb`).
- New controller action `Api::V1::ProjectsController#duplicate` that:
  - Resolves the source project via `current_user.owned_projects` (not
    `current_user.projects`) — this naturally returns 404 for non-existent and
    403-equivalent for projects the user is a member of but does not own.
    Per AC we will explicitly distinguish the two: lookup by id, then check
    ownership and return `403` if `project.owner_id != current_user.id`.
  - Delegates to `Projects::Duplicator.new(project, current_user).call`.
  - On success returns the duplicated project's full JSON (reusing
    `project_json`) with status `201`, so the React layer can navigate to it.
- New service object `app/services/projects/duplicator.rb`:
  - Wraps the entire deep copy in a single `ActiveRecord::Base.transaction`.
  - Suppresses `Project#after_create :create_default_section` for the duration
    of the duplicate (see Section 6 — Risks for mechanism choice).
  - Eager-loads source as `project.section_groups.active` and
    `project.sections.active.includes(:items)`, filtering out soft-deleted
    rows.
  - Builds new `Project` (owner = current_user, name = `"#{src.name} (kopia)"`,
    copies `description`, leaves `favorite` false and `position` nil — Rails
    default ordering will append it).
  - Builds an `id_map` of `old_section_group_id => new_section_group_id` and
    iterates groups first, then sections (linking `section_group_id` via the
    map), then items.
  - Items are inserted with `insert_all` OR `new` + `save(validate: true)` with
    `position` copied verbatim — explicitly does **not** trigger the
    `before_create :set_position` callback (preserves the negative-position
    contractor convention). Decision in Section 5.
  - Skips: `ProductCaptureSample`, `ItemFavorite`, `ProjectMembership`,
    ActiveStorage `attachment` blobs, soft-deleted records.
  - Creates a fresh `ProjectMembership` row with `role: "owner"` for the
    current user, mirroring `ProjectsController#create`.
- Item attribute whitelist (verbatim copy):
  `item_type, name, note, quantity, unit_price_cents, currency, category,
  dimensions, status, external_url, thumbnail_url, discount_label,
  discount_percent, discount_code, original_unit_price_cents, phone, address,
  unit_type, position`.
  (Card lists most of these; `discount_percent`, `discount_code`,
  `original_unit_price_cents` are added because they appear in `project_json`
  and dropping them would silently lose discount metadata. Flagged as a small
  scope-clarification — see Section 7 questions, but treated as in-scope
  here.)
- Section attribute whitelist: `name, position, section_group_id` (mapped),
  plus any non-soft-delete metadata. `deleted_at` is always nil on copies.
- Group attribute whitelist: `name, position`.

### Frontend

- New API helper `duplicateProject(id)` in `app/javascript/workspace/api/projects.ts`.
- New mutation hook `useDuplicateProject` in
  `app/javascript/workspace/hooks/useProjects.ts` that:
  - Calls `duplicateProject`.
  - Invalidates `['projects']` on success.
  - Returns the new project so the caller can navigate.
- Sidebar context menu entry "Duplikuj projekt" inserted in
  `Sidebar.tsx`'s context menu, **above** the divider that precedes "Usuń
  projekt", visible only when the active row's project is owned by
  `current_user`.
  - Owner check uses `useCurrentUser` against `project.owner_id`. (Note:
    `ProjectListItem` does not currently expose `owner_id`; see Section 7.)
- On click: fire mutation, await result, `navigate('/workspace/projects/${new.id}')`.

### Tests

- Service unit: `test/services/projects/duplicator_test.rb` — covers happy
  path, soft-deleted skip, attachment skip, capture-sample skip, favorite
  skip, membership skip, default-section suppression, position verbatim
  (including negative contractor positions), atomicity (forced failure leaves
  no rows).
- Controller integration: `test/controllers/api/v1/projects_controller_test.rb`
  adds `duplicate` cases — 201 for owner, 401 unauth, 403 non-owner member,
  404 missing/foreign.
- React component: `Sidebar.test.tsx` (or new file) covers menu visibility
  for owner vs non-owner and click → mutation → navigate flow with a mocked
  `useDuplicateProject`.

---

## 3. Out of scope (explicit list)

- Copying ActiveStorage `attachment` blobs on `ProjectItem` (skipped per PM).
- Copying `ProductCaptureSample`, `ItemFavorite`, `ProjectMembership` rows.
- Copying soft-deleted sections / items.
- Naming modal or any UI for choosing a new name.
- Allowing editors / viewers to duplicate.
- Cross-organization duplication.
- Bulk duplication, project templates, per-section duplicate, per-item
  duplicate.
- Async / Sidekiq duplication for very large projects (synchronous request
  in v1; see Risk R5).
- Re-running selector learning on the new items.
- Updating PDF generator — duplicated projects use the existing PDF pipeline
  unchanged.

---

## 4. Acceptance criteria (from card, restated as testable assertions)

1. `POST /api/v1/projects/:id/duplicate` returns 201 + new project JSON for the
   owner.
2. Same endpoint returns 403 for an authenticated user who has a
   `ProjectMembership` of role `editor` or `viewer`.
3. Same endpoint returns 401 with no auth and 404 for an id that does not
   exist or belongs to another organization (no membership).
4. New project name is exactly `"#{source.name} (kopia)"`.
5. New project has `owner_id == current_user.id` and exactly one
   `ProjectMembership` (owner = current_user).
6. The new project has no extra "Nowa sekcja" stub — the
   `after_create :create_default_section` callback is suppressed.
7. Section count on the new project equals
   `source.sections.active.count` (soft-deleted excluded).
8. Section group count on the new project equals
   `source.section_groups.active.count`, and each new section's
   `section_group_id` resolves to a new (not original) group with the same
   `name` and `position`.
9. Item count per section equals the source's active item count; soft-deleted
   items are not copied.
10. For every copied item, all whitelisted attributes match the source
    verbatim, including `position` (so a contractor whose position was
    `-3` on the source is `-3` on the copy).
11. No `ProductCaptureSample`, `ItemFavorite`, or attachment blob is created
    or referenced from the copy.
12. `created_at` / `updated_at` on all new rows are fresh (within the
    request).
13. On a forced mid-duplication failure, no `Project`, `ProjectSection`,
    `ProjectItem`, `SectionGroup`, or `ProjectMembership` row remains
    (transactional atomicity).
14. Frontend: context menu entry "Duplikuj projekt" appears only on
    owner-owned rows; non-owners do not see it.
15. Frontend: clicking the entry triggers a mutation, then navigates to
    `/workspace/projects/${new.id}`.
16. Tests: service unit, controller integration, sidebar component.

---

## 5. Alternatives considered

### Alt A — Service object `Projects::Duplicator` (CHOSEN)

- Single transaction inside `#call`, owner-only enforced in controller,
  callback suppression handled inside service via a narrow mechanism
  (Project.skip_callback or a thread-local flag — see R1).
- Pros: testable in isolation, matches existing `ProjectPdfGenerator`
  pattern, encapsulates the suppression so it cannot leak.
- Cons: introduces a new namespace `app/services/projects/`.

### Alt B — Fat controller action

- Inline the whole transaction inside `ProjectsController#duplicate`.
- Pros: zero new files, mirrors `ProjectsController#reorder`'s style.
- Cons: ~60 lines of mutation logic in a controller, harder to unit-test
  (would need full request specs only), couples HTTP concerns to deep-copy
  semantics. Rejected for testability.

### Alt C — `Project#dup` + `deep_clone` gem

- Use the `deep_cloneable` gem (`project.deep_clone include: { sections:
  :items, section_groups: nil }`).
- Pros: very little code.
- Cons: introduces a new gem dependency (flagged as risk per architect
  charter), `deep_cloneable` does not give us a clean hook to suppress the
  `after_create` callback or to skip soft-deleted rows without a custom
  `:if` block per association, and it gives weaker control over which
  attributes are copied. Rejected.

### Alt D — Database-level COPY (`INSERT ... SELECT`)

- Bulk SQL with id remapping via CTEs.
- Pros: fastest.
- Cons: bypasses Rails entirely, brittle against schema changes, no
  validations, callback suppression irrelevant but would block any future
  side effects we *do* want. Rejected — premature optimization for a
  designer-scale workload.

---

## 6. Technical risks & mitigations

| ID | Risk | Mitigation |
|----|------|-----------|
| R1 | **Suppressing `after_create :create_default_section`.** Naively `Project.skip_callback(:create, :after, :create_default_section)` is *process-global* and not thread-safe. | Use a thread-local flag: `Thread.current[:saived_skip_default_section]` checked at the top of `create_default_section`. Set inside `Duplicator#call` and `ensure`-cleared. Documented in the service's class comment. |
| R2 | **Negative contractor positions.** `before_create :set_position` resets a 0/blank `position` and would corrupt the copied ordering for contractors (negative positions). | Build items with `assign_attributes` then `save(validate: true)` — `set_position` early-returns when `position.present? && position != 0`. Add explicit test: source has a contractor at position `-2`; assert copy preserves `-2`. |
| R3 | **Atomicity.** Partial duplication on mid-stream failure. | Wrap the entire `Duplicator#call` in `ActiveRecord::Base.transaction` and re-raise. Test via a stub that raises after the first item is created; assert zero rows of any kind exist for the new project. |
| R4 | **New public route.** `POST /api/v1/projects/:id/duplicate`. *Architect-flagged risk per charter.* | Documented in routes; auth via existing `BaseController#authenticate_api_user!`; CSRF via session for SPA; explicit owner-check in the action. Same security envelope as existing `toggle_favorite`. No third-party API calls, no migration, no new dependency. |
| R5 | **Large project synchronous duplication.** A project with thousands of items could exceed Rails request timeout. | Out of scope for v1 (typical SAIVED projects have <200 items). Add a TODO comment in the service for a future Sidekiq path. If profiling later shows >5s for real projects, ticket separately. |
| R6 | **Owner check on the frontend.** `ProjectListItem` may not include `owner_id` — current `projects#index` JSON does not. | Add `owner_id` to the index payload (small additive change, no migration), or check via `currentUser.id` against a new `is_owner` boolean. Recommend adding `owner_id` to keep parity with `show`. Confirm during implementation. |
| R7 | **`section_group_id` mapping correctness.** Off-by-one bugs in id remapping silently produce sections pointing at the wrong group. | Build the map in a single pass, assert every copied section's `section_group_id` is either nil or in `id_map.values` inside the service. Covered by AC #8. |

**No** database migrations, **no** new gem dependencies, **no** third-party
API calls in this change.

---

## 7. Open questions (non-blocking — resolve during implementation)

1. **Discount fields on item copy.** Card explicitly lists only the fields up
   to `discount_label`, but `project_json` exposes `discount_percent`,
   `discount_code`, `original_unit_price_cents`. Treating them as in-scope
   (copy verbatim). If PM disagrees, drop them — service-only change.
2. **Sidebar owner-check data.** Add `owner_id` to `ProjectListItem` JSON
   (recommended) or add `is_owner` boolean. Decided during implementation;
   either is a tiny additive change.
3. **Position on the new project itself.** Card is silent. Default Rails
   behavior (nil position, ordered by `created_at`) places the duplicate at
   the end of the user's project list — matches "fresh project" intuition.
   Confirm during implementation.

These do not block Gate 1; they are flagged so the implementer raises them
back if anything is unclear.

---

## 8. Estimated size & decomposition

- Backend: service (~80 LOC), controller action (~15 LOC), routes (~1 LOC),
  service test (~120 LOC), controller test additions (~80 LOC).
- Frontend: api helper (~5 LOC), hook (~15 LOC), Sidebar diff (~25 LOC),
  component test (~60 LOC).
- **Total estimated diff: ~400 LOC** (mostly tests). Above the 300 LOC
  decomposition trigger, but the production code is ~150 LOC and the slice
  is genuinely atomic — splitting backend / frontend into two PRs would
  ship a dead endpoint and is worse. **Recommendation: ship as a single
  PR.** Flagging the size for human review at Gate 1.

---

## 9. Handoff

Gate 1 deliverable. Awaiting human review of this proposal before the
implementer subagent runs `/saived:tdd` + `/opsx:apply`.
