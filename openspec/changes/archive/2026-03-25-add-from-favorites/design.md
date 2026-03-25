## Context

Designers reuse the same products and contractors across projects. Favorites already track which items users want to reuse, but there's no way to act on that from within a project. The user must re-capture via the extension or manually fill the form.

The existing `duplicate` action in `ProjectItemsController` copies an item within the same section using `@item.dup`. The "add from favorites" feature is similar — copying item data — but across projects/sections, where the source item is identified by its favorite status rather than being in the current section.

## Goals / Non-Goals

**Goals:**
- Let users add a favorited item to any section with one click from an inline picker
- Copy all relevant fields server-side (no full item payloads sent from the client)
- Keep the picker lightweight — reuse the existing `useFavorites` hook and `GET /api/v1/favorites` data for display
- Filter by name client-side for quick search

**Non-Goals:**
- Linking items across projects (this is a copy, not a reference)
- Batch-adding multiple favorites at once
- Editing the copied item before insertion (user can edit after)
- Enriching the `GET /api/v1/favorites` response with additional fields

## Decisions

### Decision 1: Server-side copy via dedicated endpoint

**Choice:** `POST /api/v1/project_sections/:section_id/items/from_favorite/:item_id`

**Alternatives considered:**
- *Client sends full item data:* Would require fattening the favorites API response with all fields (quantity, dimensions, discount, etc.) just so the client can POST them back. Round-trip waste.
- *Reuse the duplicate endpoint:* The duplicate action is scoped to `@section.items.find(params[:id])` — the source item must be in the target section. Cross-section/cross-project copy needs different authorization logic.

**Rationale:** The backend already has the full `ProjectItem` record. It just needs to `.dup` it into the target section. The client only sends two IDs: which section and which item.

### Decision 2: Reuse `.dup` pattern from duplicate action

The new endpoint will use the same `item.dup` approach as the existing `duplicate` action:
- Copy all column values
- Clear `deleted_at`
- Append to end of target section (last position, not adjacent like duplicate)
- Copy ActiveStorage attachment if present
- Do NOT copy `ProductCaptureSample` or `ItemFavorite` records

**Key difference from duplicate:** Position is appended (end of section) rather than inserted after the original, since the source item is in a different section/project.

### Decision 3: Authorization — user must own both source and target

The endpoint must verify:
1. The target section belongs to a project the user has access to (existing `set_section` logic)
2. The source item belongs to a project the user has access to (same check as `FavoritesController#find_accessible_item`)

The item does NOT need to be favorited to be copied — the endpoint copies any accessible item. The "from_favorite" name reflects the UX flow, but the authorization is project-access-based. This keeps the endpoint simpler and more reusable.

### Decision 4: Inline picker panel in Section.tsx

**Choice:** The ♥ button opens an inline panel in the same slot where `AddItemForm` renders (below the section items). This keeps it consistent with the existing add-item flow.

**Alternatives considered:**
- *Modal/dialog:* Heavier, breaks the inline flow that the rest of the UI uses
- *Dropdown from the button:* Too small for a list with thumbnails and search

**Implementation:** New `openForm` state value `'favorite'` in Section.tsx. When set, renders `FavoritePicker` instead of `AddItemForm`.

### Decision 5: Client-side search filtering

The favorites list is small enough (likely <100 items per user) to filter entirely client-side. No backend search endpoint needed. Simple case-insensitive substring match on `name`.

### Decision 6: Exclude notes from the picker

Notes are text-only items used for client communication in a specific project context. They don't make sense to reuse across projects. The picker will filter out items where `item_type === 'note'`.

## Risks / Trade-offs

**[Source item deleted after favoriting]** → Not a risk. Favorites reference existing `ProjectItem` records via join table. If the source is soft-deleted, it won't appear in `GET /api/v1/favorites` (default scope excludes deleted items). The picker will naturally exclude it.

**[Large favorites list]** → Client-side filtering might feel slow with 200+ favorites. Mitigation: unlikely for the current user base. Can add server-side search later if needed.

**[Copied item has stale price]** → The copy captures the price at copy time. If the source item's price is later updated, the copy won't reflect that. This is intentional — each project item is independent, same as the extension capture behavior.

**[Attachment copy cost]** → Copying ActiveStorage blobs (downloading + re-uploading) adds latency for items with attachments. Mitigation: most products don't have attachments (contractors sometimes do). Acceptable for single-item copy.
