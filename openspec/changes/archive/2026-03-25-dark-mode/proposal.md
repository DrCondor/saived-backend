## Why

Interior designers often work in the evenings reviewing cost estimates and organizing projects. The current light-only dashboard causes eye strain in low-light environments. A dark mode provides visual comfort, aligns with modern SPA expectations, and reinforces SAIVED's minimal, calm aesthetic.

## What Changes

- New semantic color token system via CSS custom properties, replacing hardcoded Tailwind color classes across all workspace components
- Tailwind v4 `@custom-variant dark` configuration for selector-based dark mode (`.dark` class on `<html>`)
- Light/dark theme definitions in `application.tailwind.css` using `:root` and `.dark` selectors
- New `ThemeContext` React provider exposing `{ theme, toggleTheme }` to the component tree
- Sun/moon toggle button in the Header component, between navigation and user dropdown
- Theme persisted to `localStorage` with inline `<script>` in the ERB template to prevent flash of wrong theme on page load
- Smooth 200ms transition on toggle via temporary `.transitioning` class (removed after 300ms to avoid transitions during normal navigation)
- Logo treatment in dark mode: subtle ring and rounded corners to frame the `.jpg` logo on dark backgrounds
- Accent colors (emerald, amber, red) adjusted for dark backgrounds using `dark:` prefix overrides
- Shadows reduced/replaced with subtle borders in dark mode for appropriate depth cues
- Default theme: light (no OS preference detection)

## Capabilities

### New Capabilities
- `dark-mode-theming`: Semantic color token system (CSS custom properties), light/dark theme definitions, Tailwind v4 dark mode configuration, and the `.transitioning` class for smooth toggle animation
- `dark-mode-toggle`: Theme toggle UI (sun/moon icon in Header), ThemeContext provider, localStorage persistence, and flash-prevention script in the server-rendered template

### Modified Capabilities
None — this is a visual/theming layer that does not change any existing feature requirements. All CRUD, drag-and-drop, favorites, and PDF export behavior remains identical.

## Impact

- **CSS**: `application.tailwind.css` gains `@custom-variant`, `@theme`, `:root`/`.dark` token definitions, and `.transitioning` rule
- **Server template**: `index.html.erb` gains inline script for theme initialization and updated `<body>` classes
- **React infrastructure**: New `ThemeContext.tsx` provider, `App.tsx` wraps with provider
- **All 24 workspace components**: Migrate hardcoded neutral color classes (`bg-white`, `text-neutral-*`, `border-neutral-*`) to semantic token classes (`bg-surface`, `text-primary`, `border-default`); add `dark:` overrides for accent colors (emerald, amber, red)
- **Header.tsx**: Toggle button added, logo gets conditional dark-mode framing
- **No backend changes** — purely frontend/CSS
- **No API changes** — theme preference stored client-side only
- **No breaking changes** — light mode appearance is unchanged
