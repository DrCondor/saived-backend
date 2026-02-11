## ADDED Requirements

### Requirement: Undo last action via keyboard shortcut
The system SHALL undo the most recent user action in the active project when the user presses Ctrl+Z (Windows/Linux) or Cmd+Z (macOS), provided no input element is focused.

#### Scenario: Undo a field edit
- **WHEN** the user has edited an item field (e.g., name, price, quantity) and presses Ctrl+Z / Cmd+Z with no input focused
- **THEN** the system SHALL revert the field to its previous value via an API call and update the UI accordingly

#### Scenario: Undo a delete
- **WHEN** the user has deleted an item, section, or section group and presses Ctrl+Z / Cmd+Z
- **THEN** the system SHALL restore the deleted record (and all cascaded children) and update the UI to show the restored data

#### Scenario: Undo a create
- **WHEN** the user has created an item, section, or section group and presses Ctrl+Z / Cmd+Z
- **THEN** the system SHALL delete the created record and update the UI to remove it

#### Scenario: Undo a reorder
- **WHEN** the user has reordered items or sections via drag-and-drop and presses Ctrl+Z / Cmd+Z
- **THEN** the system SHALL restore the previous ordering via an API call and update the UI

#### Scenario: Input element is focused
- **WHEN** the user presses Ctrl+Z / Cmd+Z while an INPUT, TEXTAREA, or contentEditable element is focused
- **THEN** the system SHALL NOT intercept the shortcut and SHALL let the browser handle native text undo

#### Scenario: Empty undo stack
- **WHEN** the user presses Ctrl+Z / Cmd+Z and the undo stack for the active project is empty
- **THEN** the system SHALL do nothing (no toast, no error)

### Requirement: Redo last undone action via keyboard shortcut
The system SHALL redo the most recently undone action when the user presses Ctrl+Shift+Z (Windows/Linux) or Cmd+Shift+Z (macOS), provided no input element is focused.

#### Scenario: Redo after undo
- **WHEN** the user has undone an action and presses Ctrl+Shift+Z / Cmd+Shift+Z with no input focused
- **THEN** the system SHALL re-apply the original action via an API call and update the UI

#### Scenario: Redo stack cleared by new action
- **WHEN** the user performs a new action after undoing
- **THEN** the redo stack SHALL be cleared and Ctrl+Shift+Z SHALL do nothing

#### Scenario: Empty redo stack
- **WHEN** the user presses Ctrl+Shift+Z / Cmd+Shift+Z and the redo stack for the active project is empty
- **THEN** the system SHALL do nothing (no toast, no error)

### Requirement: Per-project undo/redo stacks
The system SHALL maintain separate undo and redo stacks for each project, scoped by project ID.

#### Scenario: Stacks are project-scoped
- **WHEN** the user makes edits in Project A, navigates to Project B, and presses Ctrl+Z
- **THEN** the system SHALL only undo actions from Project B's stack (or do nothing if Project B's stack is empty)

#### Scenario: Stacks preserved across navigation
- **WHEN** the user makes edits in Project A, navigates to Project B, then returns to Project A
- **THEN** Project A's undo/redo stacks SHALL still contain the previous entries

#### Scenario: Stacks cleared on page refresh
- **WHEN** the user refreshes the page
- **THEN** all undo/redo stacks SHALL be cleared

### Requirement: Undo stack has a fixed cap of 20 entries
The system SHALL store a maximum of 20 undo entries per project. The redo stack SHALL also be capped at 20 entries.

#### Scenario: Stack overflow
- **WHEN** the undo stack contains 20 entries and the user performs a new action
- **THEN** the system SHALL evict the oldest entry and add the new entry

### Requirement: Toast notification on undo and redo
The system SHALL display an auto-dismissing toast notification when an undo or redo action is performed.

#### Scenario: Toast on undo
- **WHEN** the user successfully undoes an action
- **THEN** the system SHALL display a toast with the text "Cofnięto: {action description}" that auto-dismisses after 3 seconds

#### Scenario: Toast on redo
- **WHEN** the user successfully redoes an action
- **THEN** the system SHALL display a toast with the text "Ponowiono: {action description}" that auto-dismisses after 3 seconds

#### Scenario: Toast on undo failure
- **WHEN** an undo API call fails (e.g., record was modified externally)
- **THEN** the system SHALL display an error toast "Nie udało się cofnąć — dane mogły zostać zmienione" and remove the failed entry from the stack

#### Scenario: Multiple toasts
- **WHEN** the user triggers multiple undo/redo actions in rapid succession
- **THEN** the system SHALL stack multiple toasts visually without replacing previous ones

### Requirement: Undoable action types
The system SHALL support undo/redo for the following action types within the project view:

- Inline field edits (item name, price, quantity, status, category, dimensions, etc.)
- Item creation (product, contractor, note)
- Item deletion
- Section creation
- Section name edit
- Section deletion
- Section group creation
- Section group name edit
- Section group deletion
- Item reorder (within and across sections)
- Section/group reorder
- Toggle item favorite
- Toggle project favorite

#### Scenario: Edit field undo restores exact previous value
- **WHEN** the user changes an item's unit_price from 299.99 to 399.99 and undoes
- **THEN** the unit_price SHALL be restored to 299.99

#### Scenario: Delete section undo restores section and all items
- **WHEN** the user deletes a section containing 5 items and undoes
- **THEN** the section and all 5 items SHALL be restored in their original positions

#### Scenario: Toggle favorite undo re-toggles
- **WHEN** the user favorites an item and undoes
- **THEN** the item SHALL be unfavorited
