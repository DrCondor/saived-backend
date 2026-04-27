# Trello source

**Card:** T11HZIJ9
**Title:** project duplication
**URL:** https://trello.com/c/T11HZIJ9
**List:** To Do

## Description

## Business context

Designers often start a new project from a similar past one (same client, same template scope, same sections). Today the only option is rebuilding from scratch or capturing items again via the extension. Project duplication lets a designer clone an existing project as a starting point, preserving structure and items while giving them a fresh project to edit independently.

## Acceptance criteria

- [ ] Duplicate action available from the **sidebar context menu** on a project (visible only to the project owner)
- [ ] Duplicating a project creates a new `Project` owned by the current user with name `"<original name> (kopia)"` (no naming modal — auto-named)
- [ ] All active (non soft-deleted) `ProjectSection`s are copied with their `name`, `position`, and `section_group` association preserved
- [ ] All active (non soft-deleted) `ProjectItem`s under each section are copied, preserving: `item_type`, `name`, `note`, `quantity`, `unit_price_cents`, `currency`, `category`, `dimensions`, `status`, `external_url`, `thumbnail_url`, `discount_label`, `phone`, `address`, `unit_type`, `position`
- [ ] `SectionGroup`s on the original project are copied (and re-linked from the new sections)
- [ ] Default section auto-creation (`after_create :create_default_section`) is suppressed during duplication so we don't get a stray empty section
- [ ] Soft-deleted sections and items are NOT copied
- [ ] `ProductCaptureSample` records are NOT copied
- [ ] `ItemFavorite` records are NOT copied
- [ ] `ProjectMembership` records are NOT copied — duplicate has only the duplicating user as owner
- [ ] Non-owners (editor/viewer) attempting to duplicate get 403
- [ ] Timestamps fresh on the new records
- [ ] Duplication is atomic — failure mid-copy leaves no partial project
- [ ] On success, user is navigated to the new project
- [ ] API endpoint tested: success, 401 unauth, 403 non-owner, 404 missing
- [ ] Frontend component test for sidebar menu duplicate flow

## Scope (in)

- New API endpoint: `POST /api/v1/projects/:id/duplicate` (owner-only)
- Service object `Projects::Duplicator` (deep-copy in a single transaction)
- React mutation hook `useDuplicateProject` and a sidebar context menu entry
- Tests: service unit, controller integration, React component

## Out of scope

- Copying ActiveStorage attachments on `ProjectItem`
- Copying `ProductCaptureSample`, `ItemFavorite`, `ProjectMembership`
- Copying soft-deleted records
- Naming modal (auto-named only)
- Allowing non-owners to duplicate
- Cross-organization duplication
- Bulk duplication / templates
- Per-section / per-item duplication

## PM decisions (2026-04-27)

1. UI placement: sidebar context menu
2. Default name: auto `"<name> (kopia)"`, no modal
3. Attachments: skipped in v1
4. Permission: owner-only

## Technical risks / notes

- `Project#after_create :create_default_section` must be suppressed during duplication
- Item positions can be negative (contractors); copy verbatim, do not re-run `before_create :set_position`
- Single DB transaction for atomicity
- Eager-load source: `sections.includes(:items, :section_group)`

## Estimated decomposition

Single slice — backend + frontend in one PR.

## Comments

(none on the source card; PM-resolved questions captured above)
