## Context

Items (`ProjectItem`) support three types — product, contractor, note — each with different field sets. Items belong to a `ProjectSection` and are ordered by `position` (integer). The existing action panel on item cards (grid + list views) shows favorite and delete buttons on hover. The backend uses soft-delete, optimistic updates, and an undo/redo system.

Items can have:
- Prices stored as cents (`unit_price_cents`, `original_unit_price_cents`) with discount logic
- ActiveStorage attachments (contractor file uploads)
- Associated `ProductCaptureSample` records (historical scraping data)
- Associated `ItemFavorite` records (per-user)

## Goals / Non-Goals

**Goals:**
- One-click exact duplication of any item (product, contractor, note)
- Duplicate appears immediately after the original in position order
- All data fields and attachments are copied 1:1
- Integrates with existing undo/redo system
- Consistent UI placement in the existing hover action panel (grid + list views)

**Non-Goals:**
- Moodboard view support (read-only view, no actions)
- Batch/multi-select duplication
- Cross-section duplication (duplicate to a different section)
- Keyboard shortcuts
- Duplicating `ProductCaptureSample` records (historical, tied to original capture event)
- Auto-favoriting the duplicate

## Decisions

### 1. Dedicated server-side endpoint over client-side reconstruction

**Choice**: `POST /api/v1/project_sections/:section_id/items/:id/duplicate`

**Why**: The item model has complex derived state — `original_unit_price_cents` for discount tracking, ActiveStorage blobs that need server-side duplication, and position management that requires atomic updates. Client-side reconstruction would need to extract all fields, handle file re-upload, and manage position insertion — fragile and duplicating business logic.

**Alternative considered**: Client reads item fields and POSTs to existing create endpoint. Rejected because: can't duplicate attachments from client, discount price fields would be re-processed incorrectly, and position insertion isn't supported by the create endpoint.

### 2. ActiveRecord `dup` for attribute copying

**Choice**: Use Rails' `item.dup` which copies all attribute values, clears `id` and timestamps.

**Why**: Automatically picks up any new fields added to the model in the future. No need to maintain an explicit field list. We just need to additionally clear `deleted_at` and handle position.

### 3. Position insertion with batch shift

**Choice**: Insert duplicate at `original.position + 1`, then `UPDATE ... SET position = position + 1 WHERE position > original.position` for all items in the section.

**Why**: Maintains contiguous ordering. The shift is a single SQL UPDATE — fast even with many items. Wrapping in a transaction ensures atomicity.

**Alternative considered**: Fractional positions (e.g., 2.5 between 2 and 3). Rejected — adds complexity to sorting and the existing codebase uses integers throughout.

### 4. Attachment duplication via blob download + re-attach

**Choice**: Download the original blob's bytes and attach as a new blob on the duplicate.

```ruby
new_item.attachment.attach(
  io: StringIO.new(@item.attachment.download),
  filename: @item.attachment.filename.to_s,
  content_type: @item.attachment.content_type
)
```

**Why**: Creates a truly independent copy. Deleting the original won't affect the duplicate's attachment.

**Alternative considered**: Sharing the same blob between both items. Rejected — ActiveStorage `has_one_attached` doesn't support shared blobs cleanly, and deletion of one item would orphan the other's attachment.

### 5. UI placement: icon button in existing hover action panel

**Choice**: Add a copy icon button between the favorite (heart) and delete (trash) buttons in the hover action panel on both `ItemCard` and `ItemCardCompact`.

**Why**: Follows the established pattern — no new UI paradigms needed. The action panel already handles show-on-hover behavior. Placing between favorite and delete groups constructive actions (fav, duplicate) above destructive (delete).

**Styling**: Emerald hover color (`hover:text-emerald-500 hover:bg-emerald-50`) to signal constructive action, matching the app's accent color.

### 6. No confirmation dialog

**Choice**: Duplicate immediately on click, rely on undo for mistakes.

**Why**: Duplicating is non-destructive (doesn't modify or remove anything). The undo system already handles reversal by deleting the duplicate. A confirmation dialog would slow down the common case for a rare mistake.

### 7. Undo integration

**Choice**: Push undo entry in `onSuccess` (not `onMutate`) since we need the server-generated ID of the duplicate.

```
undo: deleteItem(sectionId, duplicateId)
redo: duplicateItem(sectionId, originalItemId)
```

**Why**: Can't do optimistic duplicate insertion — we don't know the new item's server-assigned ID, prices (discount recalculation), or attachment URL until the server responds. This is consistent with how `useCreateItem` works.

## Risks / Trade-offs

**Storage cost from attachment duplication** → Acceptable trade-off. Attachments are typically small documents (PDF, images). The alternative (shared blobs) creates fragile coupling between items.

**Position shift performance on large sections** → Single SQL UPDATE, indexed on `project_section_id`. Even with 1000+ items, this is sub-millisecond. No concern.

**Discount fields copied as-is** → Since we copy `unit_price_cents`, `original_unit_price_cents`, `discount_percent`, `discount_code`, and `discount_label` verbatim, the duplicate preserves the exact pricing state. No re-application of discount logic needed (which could produce different results if discount settings changed).

**No optimistic UI update** → User sees the duplicate after server response (slight delay). Acceptable because: (a) the create endpoint is fast, (b) optimistic insert would require generating a temp ID and guessing server-calculated fields, adding significant complexity.
