## 1. View Mode Persistence

- [x] 1.1 Add localStorage helpers (`getViewMode`, `setViewMode`) in `ProjectView.tsx` — read from `saived_view_mode`, validate against allowed values, default to `grid`
- [x] 1.2 Replace `useState<ViewMode>('grid')` with initial value from `getViewMode()` and persist on change via `setViewMode()`

## 2. View-Aware Section Headers

- [x] 2.1 Add conditional header classes in `Section.tsx` — title font, badge size, chevron size, and spacing based on `viewMode` prop (grid unchanged, list compact, moodboard medium)

## 3. View-Aware Group Headers

- [x] 3.1 Pass `viewMode` prop through to `SectionGroupBlock.tsx` from `Section.tsx`
- [x] 3.2 Add conditional header classes in `SectionGroupBlock.tsx` — same scaling rules as sections, preserving `uppercase tracking-wide`
