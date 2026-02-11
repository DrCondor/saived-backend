## Context

Users perform rapid inline edits in the project view — renaming items, adjusting prices, reordering via drag-and-drop, deleting items/sections/groups. All mutations use TanStack Query with a consistent optimistic update pattern (snapshot → update cache → rollback on error → invalidate on settle). There is currently no undo mechanism and no toast/notification system. Deletes are hard deletes with cascading `dependent: :destroy` through groups → sections → items. Background jobs use ActiveJob with the async adapter (in-process); Sidekiq is prepared but not active.

## Goals / Non-Goals

**Goals:**
- Users can press Ctrl+Z / Cmd+Z to undo the last action in the project view
- Users can press Ctrl+Shift+Z / Cmd+Shift+Z to redo
- Deleting items, sections, and groups is reversible via undo
- Each undo/redo shows an auto-dismissing toast in Polish
- Undo stack is scoped per project (max 20), preserved across project navigation within the same page session

**Non-Goals:**
- Undo for settings pages (profile, organization, statuses, categories, discounts)
- Undo for project creation/deletion (sidebar-level actions)
- Persistent undo history across page refreshes or sessions
- Collaborative conflict resolution (multi-user undo)
- Redo stack persistence (redo stack is in-memory only, like undo)

## Decisions

### 1. Soft delete via `deleted_at` timestamp

**Choice**: Add `deleted_at:datetime` column to `project_items`, `project_sections`, `section_groups`. Destroy actions set the timestamp instead of deleting the record.

**Why over client-side recreation**: Recreating a deleted section with 15 items means 16 sequential API calls, new IDs for everything, broken favorites references, and lost `ProductCaptureSample` associations. Soft delete preserves IDs, relationships, and associated records. Undo is a single API call to clear the timestamp.

**Why over event-log approach**: The codebase already has a clean optimistic update pattern. Soft delete plugs into the existing destroy flow with minimal changes — replace `.destroy` with `.update!(deleted_at: Time.current)`. An event log would require a new model, serialization of full state snapshots, and a replay mechanism.

**Scoping**: Use explicit `scope :active, -> { where(deleted_at: nil) }` rather than `default_scope`. Default scopes are fragile — they silently affect joins, associations, and `unscoped` calls in surprising ways. Instead, update association declarations to use the active scope:

```ruby
# ProjectSection
has_many :items, -> { active }, class_name: "ProjectItem", dependent: :destroy

# SectionGroup
has_many :sections, -> { active }, class_name: "ProjectSection", dependent: :destroy
```

Controllers and queries add `.active` explicitly where needed.

### 2. Cascading soft delete with timestamp matching

**Choice**: When soft-deleting a section, stamp it and all its active items with the same `deleted_at` value. Same for groups → sections → items.

**Why**: Enables precise restore — only records deleted in the same cascade operation are restored. Items deleted individually before the section delete retain their own `deleted_at` and stay deleted when the section is restored.

```ruby
# SectionGroup soft delete
now = Time.current
section_group.update!(deleted_at: now)
section_group.sections.active.each do |section|
  section.update!(deleted_at: now)
  section.items.active.update_all(deleted_at: now)
end

# Restore (reverse)
section_group.update!(deleted_at: nil)
ProjectSection.unscoped.where(section_group_id: section_group.id, deleted_at: deleted_at_was).update_all(deleted_at: nil)
ProjectItem.unscoped.where(section_id: restored_section_ids, deleted_at: deleted_at_was).update_all(deleted_at: nil)
```

### 3. Restore API endpoints

**Choice**: Three new endpoints:

| Method | Path | Returns |
|--------|------|---------|
| `POST` | `/api/v1/project_sections/:section_id/items/:id/restore` | Restored item JSON |
| `POST` | `/api/v1/projects/:project_id/sections/:id/restore` | Restored section with items |
| `POST` | `/api/v1/projects/:project_id/section_groups/:id/restore` | Restored group with sections and items |

Each endpoint finds the record using `unscoped`, verifies it belongs to the user's project, clears `deleted_at` (cascading for sections/groups), and returns the restored record(s).

**Why POST, not PATCH**: Restore is an action (RPC-style), not a partial update. POST communicates intent more clearly and avoids confusion with regular field updates.

### 4. UndoRedo React context with closure-based entries

**Choice**: A React context provider wrapping the project view, holding a `Map<projectId, { undoStack, redoStack }>`.

Each entry stores `undo` and `redo` closures that capture the exact API call and cache invalidation needed:

```typescript
interface UndoEntry {
  description: string        // "Usunięto pozycję 'Krzesło'"
  undo: () => Promise<void>  // API call to reverse + invalidate
  redo: () => Promise<void>  // API call to re-apply + invalidate
}
```

**Why closures over action-type dispatch**: Each mutation knows its own reversal logic best. A closure captures the previous value, IDs, and query keys at creation time. No central switch statement, no serialization, no action-type taxonomy to maintain. Adding undo support to a new mutation is self-contained.

**Stack behavior**:
- New action → push to undo stack, clear redo stack
- Undo (Ctrl+Z) → pop undo stack, call `entry.undo()`, push to redo stack
- Redo (Ctrl+Shift+Z) → pop redo stack, call `entry.redo()`, push to undo stack
- Cap at 20 entries per project (oldest evicted)

### 5. Focus-aware keyboard handler

**Choice**: Window-level keydown listener. If `document.activeElement` is an `INPUT`, `TEXTAREA`, or has `contentEditable`, let the browser handle native text undo. Otherwise, intercept and trigger app-level undo/redo.

This runs at the `UndoRedoProvider` level, not per-component.

### 6. Toast system (new, minimal)

**Choice**: Build a lightweight toast context (~100 lines) rather than adding a dependency. The app has no existing notification system.

- Queue-based: multiple toasts can stack
- Auto-dismiss after 3 seconds
- Positioned bottom-center of viewport
- Shows Polish messages: `"Cofnięto: usunięcie pozycji 'Krzesło'"`, `"Ponowiono: usunięcie pozycji 'Krzesło'"`
- No redo button in toast (user has Ctrl+Shift+Z)

**Why not a library**: The requirement is narrow — auto-dismiss text toasts only. A library like react-hot-toast adds a dependency for ~100 lines of code we'd write anyway.

### 7. Cleanup via rake task

**Choice**: A rake task `soft_deletes:cleanup` that hard-deletes records where `deleted_at < 1.hour.ago`. Run via cron or manually in development.

**Why not Sidekiq**: Sidekiq isn't active yet. A recurring scheduled job for cleanup doesn't need real-time processing — hourly cron is sufficient. When Sidekiq is enabled later, this can migrate to a periodic job trivially.

```ruby
# lib/tasks/soft_deletes.rake
namespace :soft_deletes do
  task cleanup: :environment do
    cutoff = 1.hour.ago
    ProjectItem.unscoped.where("deleted_at < ?", cutoff).destroy_all
    ProjectSection.unscoped.where("deleted_at < ?", cutoff).destroy_all
    SectionGroup.unscoped.where("deleted_at < ?", cutoff).destroy_all
  end
end
```

Order matters: items first, then sections, then groups — avoids cascading destroy callbacks firing on already-deleted children.

### 8. Mutation hook integration pattern

**Choice**: Each mutation hook gains an optional `pushUndo` call in its `onMutate` or `onSuccess`, accessed via `useUndoRedo()` context hook.

For **edits** (field updates), the undo entry is created in `onMutate` since we have the previous value from the cache snapshot:

```typescript
// In useUpdateItem's onMutate:
const previousItem = /* from cache snapshot */;
pushUndo({
  description: `Zmieniono ${fieldLabel}`,
  undo: async () => {
    await updateItemApi(sectionId, itemId, previousValue);
    queryClient.invalidateQueries(['project', projectId]);
  },
  redo: async () => {
    await updateItemApi(sectionId, itemId, newValue);
    queryClient.invalidateQueries(['project', projectId]);
  },
});
```

For **deletes**, the undo entry is created in `onSuccess` since soft-delete needs to succeed before we offer undo:

```typescript
// In useDeleteItem's onSuccess:
pushUndo({
  description: `Usunięto pozycję '${itemName}'`,
  undo: async () => {
    await restoreItemApi(sectionId, itemId);
    queryClient.invalidateQueries(['project', projectId]);
  },
  redo: async () => {
    await deleteItemApi(sectionId, itemId);
    queryClient.invalidateQueries(['project', projectId]);
  },
});
```

For **creates**, undo = delete the created record, redo = recreate (but with new ID):

```typescript
// In useCreateItem's onSuccess (has server-assigned ID):
pushUndo({
  description: `Dodano pozycję '${item.name}'`,
  undo: async () => {
    await deleteItemApi(sectionId, item.id);
    queryClient.invalidateQueries(['project', projectId]);
  },
  redo: async () => {
    await createItemApi(sectionId, itemData);
    queryClient.invalidateQueries(['project', projectId]);
  },
});
```

Note: redo for creates produces a new ID. This is acceptable — the item content is restored, which is what the user cares about.

For **reorder** (drag & drop), undo restores the previous order:

```typescript
// In reorder mutation's onMutate:
const previousOrder = /* snapshot positions */;
pushUndo({
  description: `Zmieniono kolejność`,
  undo: async () => {
    await reorderApi(projectId, previousOrder);
    queryClient.invalidateQueries(['project', projectId]);
  },
  redo: async () => {
    await reorderApi(projectId, newOrder);
    queryClient.invalidateQueries(['project', projectId]);
  },
});
```

## Risks / Trade-offs

**[Stale undo entries after server-side changes]** → Undo closures capture IDs and values at creation time. If the server state changes (e.g., another tab or the extension modifies data), an undo call may fail or produce unexpected results. **Mitigation**: Undo API calls go through normal error handling. On failure, show an error toast ("Nie udało się cofnąć — dane mogły zostać zmienione") and remove the entry from the stack.

**[Soft-deleted records in queries]** → Every query touching items, sections, or groups must account for `deleted_at`. Missing an `.active` scope leaks deleted records. **Mitigation**: Explicit scope on associations (not default_scope) makes it visible. Tests should verify deleted records don't appear in API responses.

**[Undo stack lost on refresh]** → The in-memory stack is cleared on page refresh. Users who refresh and expect to undo will be surprised. **Mitigation**: Acceptable for v1 — the soft-deleted records still exist on the server for 1 hour, so data isn't truly lost. A "recently deleted" UI could be added later.

**[Create redo produces new IDs]** → When undoing a create (deleting it) and then redoing (recreating), the item gets a new server ID. If the user had favorited or otherwise referenced the original, that reference is broken. **Mitigation**: Edge case — unlikely in practice since the item was just created. Acceptable for v1.

**[Cleanup job timing]** → Without Sidekiq, the rake task must be triggered externally (cron). If it doesn't run, soft-deleted records accumulate. **Mitigation**: Records are invisible to users (filtered by scope), so accumulation is a storage concern, not a UX concern. Add monitoring when Sidekiq is enabled.
