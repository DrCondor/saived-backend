## Why

Users make rapid inline edits in the project view (renaming items, changing prices, reordering, deleting) and have no way to reverse mistakes. A misclick or accidental delete currently requires manually re-entering data. Ctrl+Z / Cmd+Z is a deeply ingrained reflex — users expect it to work, and its absence creates friction and anxiety around editing.

## What Changes

- **Undo/redo system**: Action-level undo (Ctrl+Z / Cmd+Z) and redo (Ctrl+Shift+Z / Cmd+Shift+Z) scoped to the project view
- **Soft delete**: Items, sections, and section groups are soft-deleted (`deleted_at` column) instead of hard-deleted, enabling reliable undo of destructive actions
- **Restore API endpoints**: New endpoints to restore soft-deleted items, sections, and groups
- **Undo stack per project**: Fixed cap of 20 entries per project, preserved in memory across project switches, cleared on page refresh
- **Keyboard shortcut handling**: Focus-aware — skips when input/textarea is focused (lets browser handle native text undo)
- **Toast notifications**: Auto-dismissing Polish-language toasts on undo/redo actions
- **Cleanup job**: Background job to hard-delete soft-deleted records older than 1 hour

## Capabilities

### New Capabilities
- `undo-redo`: Client-side undo/redo stack with keyboard shortcuts, per-project scoping, and toast feedback
- `soft-delete`: Server-side soft delete for project items, sections, and section groups with cascading delete/restore and timed cleanup

### Modified Capabilities
<!-- No existing spec-level requirements are changing. Existing delete behavior changes implementation (soft vs hard) but the user-facing delete capability remains the same — confirmation dialog, item removed from view. -->

## Impact

- **Database**: New `deleted_at:datetime` column on `project_items`, `project_sections`, `section_groups`
- **Models**: Default scopes or query modifications to exclude soft-deleted records; cascading soft-delete logic on section/group deletion
- **API**: 3 new restore endpoints (`POST .../restore`); existing delete endpoints change from hard-delete to soft-delete
- **Frontend**: New `UndoRedoContext` provider wrapping project view; all mutation hooks updated to push undo entries; new toast component for undo/redo feedback; keyboard event listener at window level
- **Background jobs**: New cleanup job to hard-delete records where `deleted_at < 1.hour.ago`
- **Tests**: New tests for soft-delete model behavior, restore endpoints, undo/redo hook, keyboard shortcut handling
