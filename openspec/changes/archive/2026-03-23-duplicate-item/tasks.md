## 1. Backend — Route and Controller

- [x] 1.1 Add `post :duplicate` member route for items in `config/routes.rb`
- [x] 1.2 Add `before_action :set_item` to include the `:duplicate` action
- [x] 1.3 Implement `duplicate` action in `ProjectItemsController` — use `@item.dup`, clear `deleted_at`, shift positions, save, duplicate attachment if present, return `item_json` with status 201

## 2. Backend — Tests

- [x] 2.1 Test successful duplication of a product (all fields copied, status 201)
- [x] 2.2 Test successful duplication of a contractor (contractor-specific fields copied)
- [x] 2.3 Test successful duplication of a note
- [x] 2.4 Test position insertion (duplicate at N+1, subsequent items shifted)
- [x] 2.5 Test attachment duplication (independent blob, same filename/content)
- [x] 2.6 Test that ProductCaptureSamples and ItemFavorites are NOT copied
- [x] 2.7 Test 401 without authentication
- [x] 2.8 Test 404 for item in another user's project
- [x] 2.9 Test 404 for non-existent item

## 3. Frontend — API and Hook

- [x] 3.1 Add `duplicateItem(sectionId, itemId)` function in `api/items.ts` — POST to duplicate endpoint
- [x] 3.2 Add `useDuplicateItem(projectId, sectionId)` hook in `hooks/useItems.ts` — invalidate project query on success, push undo entry (undo = delete duplicate, redo = duplicate again)

## 4. Frontend — UI Components

- [x] 4.1 Add `onDuplicate` prop to `ItemCard` and render copy icon button between favorite and delete in the hover action panel (emerald hover styling)
- [x] 4.2 Add `onDuplicate` prop to `ItemCardCompact` and render copy icon button between favorite and delete in the hover action panel
- [x] 4.3 Wire `handleDuplicateItem` callback in `Section.tsx` using `useDuplicateItem` hook, pass to `renderItem` for grid and list views

## 5. Frontend — Tests

- [x] 5.1 Test duplicate button renders on hover in ItemCard
- [x] 5.2 Test duplicate button renders on hover in ItemCardCompact
