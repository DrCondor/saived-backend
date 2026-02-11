## Why

The list view's section and group headers use the same large styling (`text-lg font-bold`) as the grid view, making them disproportionately heavy compared to the compact item rows. Additionally, the selected view mode resets to grid on every page reload, forcing users to re-select their preferred view each time.

## What Changes

- Scale section and group header typography (title, badge, chevron, margins) based on the active view mode — compact for list, softer for moodboard, unchanged for grid
- Persist the selected view mode to `localStorage` so it survives page reloads and navigation

## Capabilities

### New Capabilities
- `view-mode-persistence`: Persist the user's selected view mode (grid/list/moodboard) globally via localStorage
- `view-aware-headers`: Scale section and group header styling (font size, weight, badge size, spacing) proportionally to the active view mode

### Modified Capabilities

## Impact

- `app/javascript/workspace/components/Project/ProjectView.tsx` — read/write view mode from localStorage
- `app/javascript/workspace/components/Project/Section.tsx` — conditional header classes based on `viewMode`
- `app/javascript/workspace/components/Project/SectionGroupBlock.tsx` — conditional header classes based on `viewMode`
