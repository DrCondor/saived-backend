## ADDED Requirements

### Requirement: View mode persists across page reloads
The system SHALL save the user's selected view mode to `localStorage` under the key `saived_view_mode` whenever the user changes it, and SHALL restore it on page load.

#### Scenario: User selects list view and reloads
- **WHEN** user switches to list view and reloads the page
- **THEN** the view mode SHALL be list (not reset to grid)

#### Scenario: No saved preference
- **WHEN** no `saived_view_mode` key exists in localStorage
- **THEN** the view mode SHALL default to `grid`

#### Scenario: Invalid saved value
- **WHEN** `saived_view_mode` contains a value that is not `grid`, `list`, or `moodboard`
- **THEN** the view mode SHALL default to `grid`

### Requirement: View mode is global across projects
The system SHALL use a single `saived_view_mode` key (not per-project). Switching projects SHALL preserve the current view mode.

#### Scenario: Navigate between projects
- **WHEN** user is in list view on Project A and navigates to Project B
- **THEN** Project B SHALL display in list view
