# Trello source

**Card:** MUeMLF8A
**Title:** project duplication
**URL:** https://trello.com/c/MUeMLF8A
**List:** To Do

## Description

## Business context

Interior designers often reuse prior projects as starting points for new clients (similar apartments, recurring contractor lists, standard furniture sets). Today the only path is manual recreation: clone sections, re-add items, re-enter prices. A "duplicate project" action lets the designer fork an existing project in one click and then customize the copy for the new client.

## Acceptance criteria

- [ ] User can trigger "Duplicate project" from a right-click context menu on the project entry in the sidebar
- [ ] Only the project **owner** can duplicate; for non-owners the action is hidden in the UI and rejected (403) by the API
- [ ] Backend exposes `POST /api/v1/projects/:id/duplicate` returning the new project JSON (same shape as `GET /api/v1/projects/:id`)
- [ ] Duplicated project has name `"Kopia: <original name>"` by default; user can rename afterwards
- [ ] Owner of the duplicate is `current_user`
- [ ] Duplicate is created with `favorite: false` regardless of the original's favorite state
- [ ] All `section_groups`, `sections`, and `project_items` are deep-copied with positions preserved
- [ ] Item fields copied verbatim: `name`, `note`, `quantity`, `unit_type`, `unit_price_cents`, `currency`, `category`, `dimensions`, `status`, `external_url`, `thumbnail_url`, `discount_label`, `discount_percent`, `discount_code`, `original_unit_price_cents`, `item_type`, `address`, `phone`
- [ ] ActiveStorage `attachment` on `ProjectItem` is duplicated (new blob attached to the copy, not shared reference)
- [ ] `ProductCaptureSample` records are NOT copied
- [ ] `ItemFavorite` records are NOT copied
- [ ] `ProjectMembership` records are NOT copied — only an `owner` membership is created for `current_user`
- [ ] `timestamps` on the copy reflect the duplication moment, not the original
- [ ] Default empty section auto-created by `Project#after_create :create_default_section` is NOT added on top of duplicated sections (suppress for duplication path)
- [ ] Operation is atomic: failure mid-duplication rolls back, no orphan records
- [ ] 401 without auth, 403 for non-owners, 404 if project not visible to current_user, 422 on validation failure
- [ ] Rails test coverage for: success path, attachment duplication, owner-only authorization, transaction rollback
- [ ] React test coverage for: right-click menu shows "Duplikuj" only for owned projects, action triggers mutation, navigates to new project on success

## Scope (in)

- New service object `ProjectDuplicator` (or model method `Project#duplicate_for(user)`) handling the deep-copy logic
- `POST /api/v1/projects/:id/duplicate` controller action + route, owner-only authorization
- Suppression of `create_default_section` callback during duplication
- ActiveStorage attachment cloning (`blob.open` + `attach`)
- Frontend: right-click context menu on sidebar project items
- Frontend API client function, TanStack Query mutation hook, navigate to duplicated project after success
- Backend tests (controller + service)
- Frontend test for the right-click menu and duplicate action

## Out of scope (explicitly)

- Duplication by non-owners
- Header button or other entry points beyond the right-click menu
- Sharing / partial duplication (selecting which sections to copy)
- Undo / soft-delete of duplicates
- Bulk duplication of multiple projects
- Copying `ProductCaptureSample` or learning data
- Copying favorites or memberships beyond the new owner record
- PDF regeneration as part of duplication
- Other right-click actions (Rename, Delete, etc.)

## Decisions (resolved)

1. Entry point UX — right-click context menu on the sidebar project entry
2. Permission to duplicate — owners only (UI hides action for non-owners; API returns 403)
3. Naming convention — `"Kopia: <original name>"`
4. Favorite state on copy — always `favorite: false`

## Technical risks / notes

- ActiveStorage attachment duplication via `blob.open` + `attach` (avoid shared blob reference)
- Suppress `Project#after_create :create_default_section` during duplication
- Position integrity for sections and items
- Right-click menu must suppress native context menu and dismiss on outside click / Escape
- Pure additive endpoint, no public API contract change

## Estimated decomposition

Single slice — backend service + endpoint + frontend right-click menu + mutation + tests.

## Comments

**🤖** (2026-04-27):
Description refined by architect agent on 2026-04-27. Open questions surfaced — see card body.

**🤖** (2026-04-27):
Open questions resolved by PM: right-click context menu on sidebar; owners only (UI hidden + 403); name prefix "Kopia: ..."; favorite reset to false on copy.

---
