## ADDED Requirements

### Requirement: Semantic color token system
The application SHALL define a set of CSS custom properties (semantic color tokens) that map abstract color roles to concrete color values. All workspace components SHALL use semantic token utility classes instead of hardcoded Tailwind neutral color classes. The token system SHALL cover: surface backgrounds (surface, surface-page, surface-hover, surface-muted, surface-inset, surface-header), text colors (text-primary, text-secondary, text-tertiary, text-muted), and border colors (border, border-subtle, border-hover).

#### Scenario: Light mode token resolution
- **WHEN** the `<html>` element does not have the `.dark` class
- **THEN** all semantic tokens SHALL resolve to their light-mode values as defined in `:root` (e.g., `--color-surface` resolves to `white`, `--color-text-primary` resolves to `#171717`)

#### Scenario: Dark mode token resolution
- **WHEN** the `<html>` element has the `.dark` class
- **THEN** all semantic tokens SHALL resolve to their dark-mode values as defined in `.dark` (e.g., `--color-surface` resolves to `#0a0a0a`, `--color-text-primary` resolves to `#f5f5f5`)

#### Scenario: Tailwind utility class generation
- **WHEN** the CSS is built via Tailwind v4
- **THEN** semantic tokens registered in `@theme` SHALL generate valid utility classes (e.g., `bg-surface`, `text-primary`, `border-default`) that can be used directly in component class names

### Requirement: Light mode visual parity
After migration to semantic tokens, the light mode appearance of all workspace components SHALL be pixel-identical to the pre-migration appearance. No visual regression SHALL be introduced by the token migration.

#### Scenario: Component renders identically in light mode
- **WHEN** a workspace component renders in light mode (no `.dark` class)
- **THEN** its visual appearance (colors, borders, backgrounds) SHALL match the pre-migration hardcoded Tailwind class rendering exactly

### Requirement: Dark mode color palette
The dark mode palette SHALL create depth through subtle contrast — cards slightly lighter than the page background — rather than using pure black. The aesthetic SHALL feel like a "dimly lit room" rather than a void.

#### Scenario: Card-to-page contrast in dark mode
- **WHEN** dark mode is active
- **THEN** card/surface backgrounds (`--color-surface`) SHALL be visually distinguishable from the page background (`--color-surface-page`), with cards appearing slightly lighter

#### Scenario: Text readability in dark mode
- **WHEN** dark mode is active
- **THEN** all text tokens SHALL provide sufficient contrast against their expected background surfaces (primary text on surface, secondary text on surface, muted text on surface)

### Requirement: Accent color dark mode adjustments
Accent colors (emerald, amber, red) SHALL be adjusted for dark mode using Tailwind `dark:` prefix overrides. Background tints SHALL use low-opacity dark shades. Text colors SHALL shift to brighter variants for readability.

#### Scenario: Emerald accent in dark mode
- **WHEN** dark mode is active and an emerald accent background is rendered (e.g., success state)
- **THEN** the background SHALL use a low-opacity dark emerald (e.g., `emerald-950/30`) and text SHALL use a brighter emerald (e.g., `emerald-400`)

#### Scenario: Amber note styling in dark mode
- **WHEN** dark mode is active and a note-type item card is rendered
- **THEN** the card SHALL use a low-opacity dark amber background and border, with amber text shifted to a brighter variant

#### Scenario: Red destructive styling in dark mode
- **WHEN** dark mode is active and a destructive action (delete, error) is rendered
- **THEN** red text SHALL use a brighter variant (e.g., `red-400`) and red backgrounds SHALL use low-opacity dark red

### Requirement: Shadow-to-border replacement in dark mode
Shadows that are invisible on dark backgrounds SHALL be replaced with subtle border/ring treatments in dark mode to maintain visual depth cues.

#### Scenario: Dropdown shadow in dark mode
- **WHEN** dark mode is active and a dropdown or modal is rendered
- **THEN** `shadow-lg` SHALL be replaced with a subtle ring (e.g., `ring-1 ring-border`) to provide visible elevation

#### Scenario: Card hover shadow in dark mode
- **WHEN** dark mode is active and a card is hovered
- **THEN** the hover shadow SHALL be suppressed, relying on border-hover color change for the visual cue

### Requirement: Smooth theme transition animation
The system SHALL provide a `.transitioning` CSS class that, when applied to `<html>`, adds a 200ms ease transition to `background-color`, `color`, `border-color`, `fill`, and `stroke` on all elements and pseudo-elements. The transition SHALL use `!important` to override component-level transition properties.

#### Scenario: Transitioning class enables animation
- **WHEN** the `.transitioning` class is present on `<html>`
- **THEN** all elements SHALL transition their color-related properties over 200ms with ease timing

#### Scenario: No transition during normal navigation
- **WHEN** the `.transitioning` class is NOT present on `<html>`
- **THEN** no color transition SHALL be applied to elements (instant color changes during route navigation)

### Requirement: Logo visibility in dark mode
The logo image (`.jpg` with opaque background) SHALL remain visible and intentionally framed in dark mode through subtle border/ring treatment.

#### Scenario: Logo framing in dark mode
- **WHEN** dark mode is active
- **THEN** the logo SHALL display with rounded corners and a subtle light ring (e.g., `ring-1 ring-white/10`) to frame it against the dark header background

#### Scenario: Logo unchanged in light mode
- **WHEN** light mode is active
- **THEN** the logo SHALL render without any additional ring or framing treatment

### Requirement: Form input dark mode styling
All form inputs, textareas, and select elements in the workspace SHALL explicitly use semantic token classes for background, text, and border colors. They SHALL NOT rely on browser default styling.

#### Scenario: Input field in dark mode
- **WHEN** dark mode is active and a form input is rendered
- **THEN** the input SHALL have a dark background (surface token), light text (text-primary token), and visible border (border token)

#### Scenario: Placeholder text visibility
- **WHEN** dark mode is active and a form input has placeholder text
- **THEN** the placeholder text SHALL be visible using the text-muted token color
