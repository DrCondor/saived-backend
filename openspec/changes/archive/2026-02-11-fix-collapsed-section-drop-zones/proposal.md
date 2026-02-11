## Why

Dragging items between collapsed sections/subgroups in grid view is broken. The collapsed section drop zones use a `pb-20 -mb-20` CSS hack that creates 80px of invisible padding below each header. When multiple sections are collapsed consecutively, these invisible zones overlap — causing the wrong section to activate as a drop target. Moving an item upward always hits the first collapsed section instead of the intended one. This only manifests noticeably in grid view because the larger card size amplifies the overlap problem.

## What Changes

- Remove the `pb-20 -mb-20` invisible padding hack from collapsed section droppable wrappers in `Section.tsx`
- Replace with a drag-aware header expansion: when an item drag is active, collapsed section headers grow taller (via padding) to present a generous drop target without creating overlapping zones
- Each collapsed section's drop zone stays within its own visual bounds — no invisible overlap with neighbors

## Capabilities

### New Capabilities
- `collapsed-section-drop-zones`: Non-overlapping drop zone behavior for collapsed sections during item drag-and-drop

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **Files**: `app/javascript/workspace/components/Project/Section.tsx` (primary — collapsed droppable wrapper and header styling)
- **Behavior**: Drop targeting for collapsed sections becomes accurate in all views. Items dropped on collapsed sections still append to end (existing logic in `ProjectView.tsx:507-516` unchanged)
- **No API changes**: Pure frontend fix
- **No dependency changes**: Uses existing `@hello-pangea/dnd` APIs and existing `isDraggingItem` prop already passed to Section
