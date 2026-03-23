## Why

Designers frequently add similar items to projects — e.g., the same chair in different fabrics, or repeated contractor entries across sections. Currently, the only way to create a similar item is to manually re-enter all fields (or re-capture from the extension). A one-click duplicate saves time and reduces input errors, especially for items with many fields (products with discounts, contractors with attachments).

## What Changes

- New backend endpoint `POST /api/v1/project_sections/:section_id/items/:id/duplicate` that creates an exact 1:1 copy of an item
- Duplicate is inserted immediately after the original item (position-wise), shifting subsequent items
- All item data is copied: name, prices, discounts, status, dimensions, category, URLs, contractor fields, and ActiveStorage attachments
- ProductCaptureSamples and ItemFavorites are NOT copied (historical/personal data)
- New "Duplikuj" button added to the hover action panel on ItemCard (grid view) and ItemCardCompact (list view)
- Undo support: duplicating pushes an undo entry that deletes the duplicate on undo
- Works for all three item types: product, contractor, note

## Capabilities

### New Capabilities
- `item-duplication`: Server-side item duplication with position management, attachment cloning, and frontend UI integration across grid and list views

### Modified Capabilities
None — this adds a new action alongside existing CRUD operations without changing their behavior.

## Impact

- **Backend**: New `duplicate` action on `ProjectItemsController`, new route in `config/routes.rb`
- **Frontend API layer**: New `duplicateItem()` function in `api/items.ts`
- **Frontend hooks**: New `useDuplicateItem` hook in `hooks/useItems.ts` with undo integration
- **Frontend components**: `ItemCard.tsx`, `ItemCardCompact.tsx` gain `onDuplicate` prop and button; `Section.tsx` wires the callback
- **Storage**: Duplicating items with attachments creates new ActiveStorage blobs (storage cost scales with usage)
- **No breaking changes** to existing API endpoints or data model
