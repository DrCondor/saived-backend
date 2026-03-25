## ADDED Requirements

### Requirement: Theme toggle button in Header
The Header component SHALL display a theme toggle button between the navigation area and the user dropdown. The button SHALL show a moon icon when in light mode (indicating "switch to dark") and a sun icon when in dark mode (indicating "switch to light").

#### Scenario: Toggle button visible in Header
- **WHEN** the Header component renders
- **THEN** a theme toggle button SHALL be visible, positioned before the user dropdown button

#### Scenario: Moon icon in light mode
- **WHEN** the current theme is light
- **THEN** the toggle button SHALL display a moon icon

#### Scenario: Sun icon in dark mode
- **WHEN** the current theme is dark
- **THEN** the toggle button SHALL display a sun icon

#### Scenario: Clicking toggle switches theme
- **WHEN** the user clicks the theme toggle button
- **THEN** the theme SHALL switch from light to dark or from dark to light

### Requirement: ThemeContext provider
The application SHALL provide a React context (`ThemeContext`) that exposes the current theme (`"light"` or `"dark"`) and a `toggleTheme` function. The context SHALL be available to all workspace components.

#### Scenario: Context provides current theme
- **WHEN** a component consumes ThemeContext
- **THEN** it SHALL receive the current theme value (`"light"` or `"dark"`)

#### Scenario: toggleTheme switches the active theme
- **WHEN** `toggleTheme()` is called
- **THEN** the theme SHALL switch (light → dark, dark → light), the `.dark` class on `<html>` SHALL be toggled, `localStorage.theme` SHALL be updated, and the `.transitioning` class SHALL be temporarily applied for 300ms

### Requirement: Theme persistence in localStorage
The selected theme SHALL be persisted to `localStorage` under the key `theme`. The value SHALL be `"light"` or `"dark"`.

#### Scenario: Theme saved on toggle
- **WHEN** the user toggles the theme
- **THEN** the new theme value SHALL be written to `localStorage.theme`

#### Scenario: Theme restored on page load
- **WHEN** the page loads and `localStorage.theme` contains a value
- **THEN** the application SHALL apply that theme before React mounts

#### Scenario: Default theme for new users
- **WHEN** the page loads and `localStorage.theme` is not set
- **THEN** the application SHALL default to light mode (no `.dark` class applied)

### Requirement: Flash prevention on page load
An inline `<script>` in the server-rendered HTML template SHALL read `localStorage.theme` and apply the `.dark` class to `<html>` before the browser paints. This SHALL execute before any stylesheet or React bundle.

#### Scenario: Dark mode user sees no flash
- **WHEN** a user with `localStorage.theme === "dark"` loads the page
- **THEN** the `.dark` class SHALL be present on `<html>` before the first paint, preventing a flash of light mode

#### Scenario: Light mode user sees no flash
- **WHEN** a user with `localStorage.theme === "light"` (or no value) loads the page
- **THEN** the `<html>` element SHALL NOT have the `.dark` class, and the page SHALL render in light mode immediately

### Requirement: Smooth toggle transition
When the theme is toggled, the `.transitioning` class SHALL be added to `<html>` before the `.dark` class is toggled. The `.transitioning` class SHALL be removed after 300ms (allowing the 200ms CSS transition to complete with a 100ms buffer).

#### Scenario: Transition class lifecycle during toggle
- **WHEN** the user toggles the theme
- **THEN** `.transitioning` SHALL be added to `<html>`, then `.dark` SHALL be toggled, then `.transitioning` SHALL be removed after 300ms

#### Scenario: Rapid toggle handling
- **WHEN** the user toggles the theme multiple times rapidly
- **THEN** each toggle SHALL add `.transitioning`, toggle `.dark`, and schedule removal — the final state SHALL reflect the last toggle action
