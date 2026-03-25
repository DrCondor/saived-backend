## Why

Designers reuse the same products and contractors across multiple client projects. Today, to add a previously-used item to a new project, the user must re-capture it via the browser extension or manually fill out the form. Favorites already track items the user wants to reuse — this change lets them act on that intent directly from any section.

## What Changes

- Add a ♥ button to the section's add-item button bar (alongside + Produkt, + Wykonawca, + Notatka)
- Clicking the ♥ button opens an inline favorites picker panel showing the user's favorited items with thumbnail, name, price, and source project
- Clicking an item in the picker copies it into the current section and closes the picker
- A client-side search filter lets users find favorites quickly by name
- New backend endpoint copies all item fields from the source favorite into the target section (server-side copy, no need to send full item data from the client)
- Notes are excluded from the picker (favoriting notes for reuse doesn't make sense)

## Capabilities

### New Capabilities
- `add-from-favorites`: Covers the backend endpoint for copying a favorite item into a section, and the frontend picker component with search, display, and one-click add behavior

### Modified Capabilities

## Impact

- **Backend**: New endpoint on `ProjectItemsController` (or dedicated controller) for copying an item by ID into a target section. Reuses field-copying logic similar to item duplication.
- **Frontend**: New `FavoritePicker` component, changes to `Section.tsx` button bar, new mutation in `useItems` hook. Existing `useFavorites` hook provides data for the picker.
- **API**: New route `POST /api/v1/project_sections/:section_id/items/from_favorite/:item_id`
- **No migrations needed** — uses existing `item_favorites` join table and `project_items` table
