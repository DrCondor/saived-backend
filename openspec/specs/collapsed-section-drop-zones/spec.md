## ADDED Requirements

### Requirement: Collapsed section targeting SHALL use cursor position

Drop detection for collapsed sections MUST use the actual cursor/pointer position, not the library's center-of-drag-element detection. This MUST be implemented by tracking cursor position during item drags and overriding the library's destination when the cursor is over a collapsed section header.

#### Scenario: Two consecutive collapsed sections receive correct drops
- **WHEN** sections A and B are both collapsed (A above B) and user drags an item with cursor over section B's header
- **THEN** section B activates and dropping places the item in section B

#### Scenario: Three consecutive collapsed sections — middle one targeted
- **WHEN** sections A, B, and C are collapsed and user drags an item from section C upward with cursor over section B's header
- **THEN** section B activates as the drop target, not section A

#### Scenario: Direction reversal — returning to a previously passed section
- **WHEN** user drags an item upward past section B to section A, then reverses direction with cursor back over section B's header
- **THEN** section B activates as the drop target

### Requirement: Collapsed section visual feedback SHALL use cursor-based detection

When an item drag is active, collapsed section headers MUST show visual feedback (emerald highlight) based on cursor position, not the library's `snapshot.isDraggingOver`. A new prop `cursorOverCollapsedSectionId` MUST be passed from ProjectView to each Section component.

#### Scenario: Correct header highlights during drag
- **WHEN** user drags an item and cursor is over collapsed section B's header
- **THEN** section B's header shows emerald highlight, regardless of which droppable the library internally detects

#### Scenario: No highlight when cursor is between sections
- **WHEN** user drags an item and cursor is in the gap between collapsed section headers
- **THEN** no collapsed section header shows the emerald highlight

### Requirement: No layout changes during drag

The page layout MUST NOT shift, jump, or change when a drag starts or ends. No extra DOM elements, padding, or spacing SHALL be added during drag.

#### Scenario: Page stability on drag start
- **WHEN** user begins dragging an item
- **THEN** the page layout remains stable with no visible shifts

### Requirement: Drop on collapsed section SHALL append item to end

When an item is dropped onto a collapsed section (via cursor-based detection), the item MUST be appended to the end of that section's item list.

#### Scenario: Item dropped on collapsed section goes to end
- **WHEN** user drops an item with cursor over a collapsed section header
- **THEN** the item is added as the last item in that section
