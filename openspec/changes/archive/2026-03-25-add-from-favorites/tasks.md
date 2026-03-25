## 1. Backend — Copy from Favorite Endpoint

- [x] 1.1 Add route `POST /api/v1/project_sections/:section_id/items/from_favorite/:item_id` in `config/routes.rb`
- [x] 1.2 Implement `from_favorite` action in `ProjectItemsController`: find source item (verify user access), `.dup` into target section, append at last position, copy ActiveStorage attachment if present, return item JSON with status 201
- [x] 1.3 Write controller tests: success for product, success for contractor, 401 without auth, 404 for inaccessible target section, 404 for inaccessible source item, 404 for non-existent item, verify position is appended, verify associations (capture samples, favorites) are not copied

## 2. Frontend — Favorites Picker Component

- [x] 2.1 Create `FavoritePicker.tsx` component: inline panel with close button, uses `useFavorites()` hook, displays favorites as a scrollable list with thumbnail, name, price, and source project name, excludes notes
- [x] 2.2 Add client-side search input that filters favorites by name (case-insensitive substring match)
- [x] 2.3 Add empty state when no favorites exist or no search results match
- [x] 2.4 Add [+] button per item that triggers the copy mutation and closes the picker

## 3. Frontend — Section Button Bar Integration

- [x] 3.1 Add ♥ button to the add-item button bar in `Section.tsx` (after Notatka, with divider)
- [x] 3.2 Add `'favorite'` as a new `openForm` state value; when set, render `FavoritePicker` instead of `AddItemForm`
- [x] 3.3 Wire picker's close action to reset `openForm` to `null`

## 4. Frontend — API & Hook Wiring

- [x] 4.1 Add `copyFromFavorite(sectionId, itemId)` function in `api/items.ts`
- [x] 4.2 Add `useAddFromFavorite` mutation in `useItems.ts` that calls the new API, invalidates the project query on success, and closes the picker

## 5. Tests

- [x] 5.1 Write Vitest tests for `FavoritePicker`: renders favorites list, search filtering works, notes are excluded, empty state displays, click add button calls mutation
- [x] 5.2 Verify existing test suites pass (`make test`, `yarn test:run`)
