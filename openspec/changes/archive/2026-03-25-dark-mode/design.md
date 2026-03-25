## Context

The SAIVED workspace is a React 19 SPA served from a Rails ERB template (`index.html.erb`). It uses Tailwind CSS v4 (configured via `@import "tailwindcss"` in `application.tailwind.css`, no `tailwind.config.js`). All 24 workspace components use hardcoded Tailwind color classes — primarily the neutral palette (`bg-white`, `text-neutral-700`, `border-neutral-200`, etc.) with emerald (accent), amber (notes), and red (destructive) for specific UI states.

The current color usage is highly consistent: ~150+ color class instances, but only about 12 distinct semantic roles (surface, text primary/secondary/tertiary, border, hover states, etc.). The logo is a `.jpg` file (opaque, no transparency) rendered as an `<img>` tag in the Header.

Tailwind v4 handles configuration in CSS (not JS config files). Dark mode is configured via `@custom-variant` and theme tokens via `@theme` directives, both in the CSS entry point.

## Goals / Non-Goals

**Goals:**
- Dark mode that feels "dimly lit room, not a void" — calm and modernistic
- Cards slightly lighter than page background (depth through subtle contrast)
- Smooth 200ms transition only during theme toggle, not during normal navigation
- No flash of wrong theme on page load for returning users
- Logo remains visible and intentionally framed in dark mode
- Light mode appearance is pixel-identical before and after migration
- Maintainable: changing a shade means editing one CSS line, not 50 files

**Non-Goals:**
- OS preference detection (`prefers-color-scheme`) — default is light, toggle only
- Theming the Devise login/registration pages
- Theming the ActiveAdmin panel
- Server-side theme preference storage (stays in localStorage)
- Custom theme colors beyond light/dark (no "sepia mode" etc.)
- Theming product thumbnail images or external content

## Decisions

### 1. CSS custom properties (semantic tokens) over `dark:` prefix everywhere

Both approaches require touching all 24 component files. The `dark:` prefix approach doubles every color class (`bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800`), creating class bloat and spreading the dark palette definition across every component. CSS custom properties define the palette once in CSS and components reference semantic names (`bg-surface`, `text-primary`).

**Alternative considered**: Pure `dark:` prefix. Rejected because: identical migration effort but worse maintainability — adjusting dark mode shades later requires editing every component instead of one CSS block.

**Hybrid approach**: Semantic tokens for the neutral palette (covers ~80% of color usage — backgrounds, text, borders). `dark:` prefix for accent colors (emerald, amber, red) which have per-usage nuance (different shades for bg vs text vs border) and appear in fewer places.

### 2. Tailwind v4 `@theme` + `@custom-variant` for dark mode

Tailwind v4 supports custom theme values via `@theme` and custom variants via `@custom-variant`. The dark mode selector will use the `.dark` class on `<html>`:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

CSS custom properties are defined in `:root` (light) and `.dark` (dark), then registered in `@theme` so Tailwind generates utility classes like `bg-surface`, `text-primary`, `border-default`.

### 3. Semantic token mapping

| Token | Light value | Dark value | Used for |
|-------|------------|------------|----------|
| `--color-surface` | `white` | `#0a0a0a` (neutral-950) | Cards, dropdowns, inputs, modals |
| `--color-surface-page` | `#fafafa` (neutral-50) | `#0c0c0e` | Page background |
| `--color-surface-hover` | `#fafafa` (neutral-50) | `#262626` (neutral-800) | Hover states on surface elements |
| `--color-surface-muted` | `#f5f5f5` (neutral-100) | `#262626` (neutral-800) | Code blocks, placeholders, subtle fills |
| `--color-surface-inset` | `#e5e5e5` (neutral-200) | `#404040` (neutral-700) | Inset backgrounds, avatar fallbacks |
| `--color-text-primary` | `#171717` (neutral-900) | `#f5f5f5` (neutral-100) | Headings, primary text |
| `--color-text-secondary` | `#404040` (neutral-700) | `#d4d4d4` (neutral-300) | Body text, labels |
| `--color-text-tertiary` | `#525252` (neutral-600) | `#a3a3a3` (neutral-400) | Secondary labels, icons |
| `--color-text-muted` | `#a3a3a3` (neutral-400) | `#525252` (neutral-600) | Placeholders, disabled text |
| `--color-border` | `#e5e5e5` (neutral-200) | `#262626` (neutral-800) | Default borders |
| `--color-border-subtle` | `#f5f5f5` (neutral-100) | `rgba(38,38,38,0.5)` | Dividers within cards |
| `--color-border-hover` | `#d4d4d4` (neutral-300) | `#404040` (neutral-700) | Hover/focus borders |
| `--color-surface-header` | `rgba(255,255,255,0.9)` | `rgba(10,10,10,0.9)` | Header backdrop blur |

### 4. `.transitioning` class for smooth toggle only

Adding `transition` to all elements globally would cause color transitions during page navigation, which feels sluggish. Instead, a `.transitioning` class is temporarily added to `<html>` during toggle:

```css
.transitioning,
.transitioning *,
.transitioning *::before,
.transitioning *::after {
  transition: background-color 200ms ease,
              color 200ms ease,
              border-color 200ms ease,
              fill 200ms ease,
              stroke 200ms ease !important;
}
```

The `!important` overrides component-level transition properties for the 300ms window. The class is removed via `setTimeout` after 300ms (100ms buffer after the 200ms transition completes).

**Alternative considered**: `transition` on `*` always. Rejected because it causes visible color fading during route changes, which feels unintentional and sluggish.

### 5. Flash prevention via inline `<script>` in ERB template

The theme is stored in `localStorage.theme` (`"light"` or `"dark"`). An inline `<script>` block in `index.html.erb` runs before React mounts — it reads `localStorage.theme` and adds the `.dark` class to `<html>` if needed. This prevents the flash of light mode that would occur if we waited for React to hydrate.

```html
<script>
  if (localStorage.theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
</script>
```

Default is light (no class = light mode).

### 6. ThemeContext as a thin React context

The provider reads the current theme from the `<html>` class list on mount (the inline script already set it). `toggleTheme()` does three things in order:
1. Add `.transitioning` to `<html>`
2. Toggle `.dark` on `<html>` and update `localStorage.theme`
3. `setTimeout(() => remove .transitioning, 300)`

This is a simple context, not a state management library. The DOM (`<html>` class) is the source of truth, React just orchestrates the toggle.

### 7. Logo treatment in dark mode

The logo (`saived-logo.jpg`) has an opaque background. In dark mode, it needs intentional framing to avoid looking like a floating white square:

- Wrap in a container with `rounded-lg overflow-hidden`
- In dark mode, add `dark:ring-1 dark:ring-white/10` for a subtle light border

This is minimal and doesn't require a separate logo asset. If a transparent/light logo variant is created later, it can be swapped with `dark:hidden` / `hidden dark:block` on two `<img>` elements.

### 8. Accent color dark mode adjustments via `dark:` prefix

Accent colors (emerald, amber, red) are used in context-specific ways that don't map cleanly to semantic tokens. They keep their direct Tailwind classes with `dark:` overrides:

| Light | Dark | Context |
|-------|------|---------|
| `bg-emerald-50` | `dark:bg-emerald-950/30` | Success backgrounds |
| `text-emerald-700` | `dark:text-emerald-400` | Success text |
| `bg-emerald-500 text-white` | (unchanged) | Primary buttons |
| `bg-amber-50/50` | `dark:bg-amber-900/20` | Note card backgrounds |
| `border-amber-200` | `dark:border-amber-700/30` | Note card borders |
| `text-amber-600` | `dark:text-amber-400` | Note icons |
| `text-red-600` | `dark:text-red-400` | Destructive text |
| `bg-red-50` | `dark:bg-red-950/30` | Error backgrounds |

### 9. Shadows in dark mode

Shadows are nearly invisible on dark backgrounds. Rather than increasing shadow intensity (which looks harsh), dark mode replaces shadow-based elevation with subtle borders:

- `shadow-lg` on dropdowns/modals → `dark:shadow-none dark:ring-1 dark:ring-border`
- `hover:shadow-md` on cards → `dark:hover:shadow-none` (border hover already provides the visual cue)

### 10. Migration order

Components are migrated inside-out (shared → layout → features → pages) to minimize intermediate broken states:

1. CSS infrastructure (tokens, variants, transitions)
2. ERB template (flash prevention, body classes)
3. ThemeContext + App.tsx wiring
4. Header (toggle button + logo treatment)
5. Layout wrapper (if needed)
6. Shared components (EditableField, StatusSelect, UnitTypeSelect, ToastContainer)
7. Item cards (3 variants: grid, compact, moodboard)
8. Section, SectionGroupBlock
9. Sidebar
10. ProjectView, ProjectToolbar
11. AddItemForm
12. Settings pages (6 components)
13. ExtensionUpdateModal
14. Pages (FavoritesPage, if any direct styling)

## Risks / Trade-offs

**[Pixel regression in light mode]** → Semantic tokens must map exactly to current hardcoded values. Verify with side-by-side screenshots before and after migration. The risk is medium because some neutral values may be used in non-obvious ways.

**[Tailwind v4 `@theme` + CSS vars interaction]** → This is a relatively new Tailwind v4 pattern. If utility generation doesn't work as expected, fallback is to use `bg-[var(--surface)]` syntax instead of `bg-surface`. Slightly uglier but functionally identical.

**[Large changeset across 24 files]** → This is unavoidable — every component has hardcoded colors. Mitigate by migrating in logical groups and testing each group before proceeding.

**[Form inputs in dark mode]** → Browser default form controls (inputs, selects) can look odd in dark mode. All form elements must explicitly set background and text colors via semantic tokens. Native `<select>` dropdowns may need custom styling or replacement with a custom component.

**[Third-party content]** → Product thumbnails from e-commerce sites have their own backgrounds (usually white). These will appear as bright rectangles in dark mode. This is expected and acceptable — it's how the product actually looks.

## Open Questions

- Should the moodboard view overlay (`bg-black/50`) be adjusted for dark mode, or does it work as-is on dark backgrounds? (Likely fine, but needs visual testing.)
- The `bg-neutral-800 text-white` avatar fallback — does this need to change in dark mode, or does a dark circle still look good on a dark background? May need to invert to `dark:bg-neutral-200 dark:text-neutral-800`.
