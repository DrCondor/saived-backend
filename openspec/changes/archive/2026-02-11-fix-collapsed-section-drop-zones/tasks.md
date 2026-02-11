## 1. Clean up previous attempts

- [x] 1.1 Remove `pb-20 -mb-20` from collapsed section droppable wrapper
- [x] 1.2 Revert `py-4` header padding and `mb-1` margin changes
- [x] 1.3 Revert section container `mb-1` conditional
- [x] 1.4 Remove visible drop zone placeholder ("Upuść tutaj" div) from collapsed Droppable

## 2. Add cursor tracking in ProjectView

- [x] 2.1 Add `cursorOverCollapsedSectionId` state and `cursorPosRef` ref in ProjectView
- [x] 2.2 Add mousemove handler that checks cursor against collapsed section header rects (using `document.getElementById` + `getBoundingClientRect`), updates state only when detected section changes
- [x] 2.3 Attach mousemove listener on ITEMS drag start, remove on drag end

## 3. Override drop detection for collapsed sections

- [x] 3.1 In `handleDragEnd`, before dispatching to `handleItemReorder`: if `cursorOverCollapsedSectionId` is set, construct an overridden result with destination `section-{id}` and pass to `handleItemReorder`

## 4. Wire up visual feedback in Section

- [x] 4.1 Add `cursorOverCollapsedSectionId` prop to Section component
- [x] 4.2 In collapsed Droppable rendering: use `cursorOverCollapsedSectionId === section.id` instead of `snapshot.isDraggingOver` for header highlighting

## 5. Verify behavior

- [ ] 5.1 Test grid view: drag from 3rd to 2nd collapsed section — 2nd highlights and receives drop
- [ ] 5.2 Test grid view: drag to 1st, reverse to 2nd — 2nd highlights and receives drop
- [ ] 5.3 Test list view: same scenarios, no regression
- [ ] 5.4 Test no page jumps on drag start/end
- [ ] 5.5 Test expanded sections still work normally (library detection untouched)
