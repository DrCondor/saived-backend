## 1. Database Migrations

- [x] 1.1 Add `deleted_at:datetime` column to `project_items` table (with index)
- [x] 1.2 Add `deleted_at:datetime` column to `project_sections` table (with index)
- [x] 1.3 Add `deleted_at:datetime` column to `section_groups` table (with index)

## 2. Model Soft-Delete Logic

- [x] 2.1 Add `scope :active` and `soft_delete!` method to `ProjectItem` model — scope filters `where(deleted_at: nil)`, method sets `deleted_at` to current timestamp
- [x] 2.2 Add `scope :active` and `soft_delete!` method to `ProjectSection` model — cascades soft delete to active items with same timestamp
- [x] 2.3 Add `scope :active` and `soft_delete!` method to `SectionGroup` model — cascades soft delete to active sections and their active items with same timestamp
- [x] 2.4 Add `restore!` method to `ProjectItem` — clears `deleted_at`, validates parent section is not soft-deleted
- [x] 2.5 Add `restore!` method to `ProjectSection` — clears `deleted_at` on section and cascade-restores items matching the section's original `deleted_at` timestamp; validates parent group (if any) is not soft-deleted
- [x] 2.6 Add `restore!` method to `SectionGroup` — clears `deleted_at` on group, cascade-restores sections and their items matching the group's original `deleted_at` timestamp
- [x] 2.7 Update association scopes to filter soft-deleted records — `ProjectSection has_many :items, -> { active }`, `SectionGroup has_many :sections, -> { active }`, `Project has_many :sections, -> { active }`, `Project has_many :section_groups, -> { active }`
- [x] 2.8 Write model tests for soft-delete: single item delete, section cascade, group cascade, timestamp matching on restore, individually-deleted children not restored on parent restore

## 3. Controller Changes (Soft Delete + Restore Endpoints)

- [x] 3.1 Update `ProjectItemsController#destroy` to call `soft_delete!` instead of `destroy`
- [x] 3.2 Update `SectionsController#destroy` to call `soft_delete!` instead of `destroy`
- [x] 3.3 Update `SectionGroupsController#destroy` to call `soft_delete!` instead of `destroy`
- [x] 3.4 Add `POST /api/v1/project_sections/:section_id/items/:id/restore` endpoint — finds item via `unscoped`, calls `restore!`, returns restored item JSON
- [x] 3.5 Add `POST /api/v1/projects/:project_id/sections/:id/restore` endpoint — finds section via `unscoped`, calls `restore!`, returns section with restored items JSON
- [x] 3.6 Add `POST /api/v1/projects/:project_id/section_groups/:id/restore` endpoint — finds group via `unscoped`, calls `restore!`, returns group with restored sections and items JSON
- [x] 3.7 Add routes for restore endpoints in `config/routes.rb`
- [x] 3.8 Verify existing API responses exclude soft-deleted records (projects index, project show, favorites)
- [x] 3.9 Write controller tests for restore endpoints: success cases (200), unauthorized (401), not found (404), not-deleted item (422), parent-still-deleted (422), cascade restore correctness

## 4. Cleanup Rake Task

- [x] 4.1 Create `lib/tasks/soft_deletes.rake` — hard-deletes records where `deleted_at < 1.hour.ago` in order: items, sections, groups
- [x] 4.2 Write test for cleanup task: records older than 1 hour destroyed, records newer preserved, correct deletion order

## 5. Frontend: Toast System

- [x] 5.1 Create `ToastContext` and `ToastProvider` — queue-based state, `addToast(message, type)` method, auto-dismiss after 3 seconds
- [x] 5.2 Create `ToastContainer` component — renders stacked toasts at bottom-center of viewport, supports success and error variants
- [x] 5.3 Mount `ToastProvider` in `App.tsx` (wraps entire app so it's available everywhere)
- [x] 5.4 Write tests for toast context: adding toasts, auto-dismiss timing, multiple toast stacking

## 6. Frontend: UndoRedo Context

- [x] 6.1 Create `UndoRedoContext` and `UndoRedoProvider` — holds `Map<projectId, { undoStack, redoStack }>`, exposes `pushUndo`, `undo`, `redo`, `canUndo`, `canRedo`
- [x] 6.2 Implement stack cap of 20 (evict oldest on overflow) and redo-clear-on-new-action behavior
- [x] 6.3 Add window-level keydown listener for Ctrl+Z / Cmd+Z (undo) and Ctrl+Shift+Z / Cmd+Shift+Z (redo) — skip when INPUT/TEXTAREA/contentEditable is focused
- [x] 6.4 Wire undo/redo to toast system — show "Cofnięto: {description}" on undo, "Ponowiono: {description}" on redo, error toast on failure
- [x] 6.5 Accept `activeProjectId` from route params to scope stack operations to current project
- [x] 6.6 Mount `UndoRedoProvider` in project view (inside `ToastProvider`, wrapping project content)
- [x] 6.7 Write tests for undo/redo context: push/pop, stack cap, redo cleared on new action, project scoping, focus-aware keyboard handling

## 7. Frontend: Restore API Functions

- [x] 7.1 Add `restoreItem(sectionId, itemId)` to `api/items.ts`
- [x] 7.2 Add `restoreSection(projectId, sectionId)` to `api/sections.ts`
- [x] 7.3 Add `restoreSectionGroup(projectId, groupId)` to API layer

## 8. Frontend: Integrate Undo into Mutation Hooks

- [x] 8.1 Add undo/redo entry to `useUpdateItem` — capture previous field value in `onMutate`, push undo with API calls to restore/re-apply
- [x] 8.2 Add undo/redo entry to `useDeleteItem` — push in `onSuccess` with restore API for undo, delete API for redo
- [x] 8.3 Add undo/redo entry to `useCreateItem` — push in `onSuccess` with delete API for undo, create API for redo
- [x] 8.4 Add undo/redo entry to `useUpdateSection` (name edit) — capture previous name in `onMutate`
- [x] 8.5 Add undo/redo entry to `useDeleteSection` — push in `onSuccess` with restore API for undo
- [x] 8.6 Add undo/redo entry to `useCreateSection` — push in `onSuccess` with delete API for undo
- [x] 8.7 Add undo/redo entry to `useUpdateSectionGroup` (name edit) — capture previous name in `onMutate`
- [x] 8.8 Add undo/redo entry to `useDeleteSectionGroup` — push in `onSuccess` with restore API for undo
- [x] 8.9 Add undo/redo entry to `useCreateSectionGroup` — push in `onSuccess` with delete API for undo
- [x] 8.10 Add undo/redo entry to `useReorderProject` (items/sections/groups reorder) — capture previous order in `onMutate`
- [x] 8.11 Add undo/redo entry to `useToggleFavorite` (item favorite) — push toggle-back for undo
- [x] 8.12 Add undo/redo entry to project favorite toggle — push toggle-back for undo

## 9. End-to-End Verification

- [x] 9.1 Manual test: edit item field → Ctrl+Z reverts → Ctrl+Shift+Z re-applies, toast shows each time
- [x] 9.2 Manual test: delete section with items → Ctrl+Z restores section and all items in place
- [x] 9.3 Manual test: Ctrl+Z while typing in an input field does native text undo (not app undo)
- [x] 9.4 Manual test: switch projects, verify undo stack is project-scoped
- [x] 9.5 Run full Rails test suite (`make test`) — all existing + new tests pass
- [x] 9.6 Run full React test suite (`yarn test:run`) — all existing + new tests pass
