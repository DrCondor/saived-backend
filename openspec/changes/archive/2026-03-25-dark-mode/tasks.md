## 1. CSS Infrastructure

- [x] 1.1 Add `@custom-variant dark (&:where(.dark, .dark *));` to `application.tailwind.css`
- [x] 1.2 Define `:root` light theme CSS custom properties (all 13 semantic tokens from design decision #3)
- [x] 1.3 Define `.dark` dark theme CSS custom properties (all 13 semantic tokens)
- [x] 1.4 Register semantic tokens in `@theme` block so Tailwind generates utility classes (`bg-surface`, `text-primary`, `border-default`, etc.)
- [x] 1.5 Add `.transitioning` CSS rule with 200ms ease transition on `background-color`, `color`, `border-color`, `fill`, `stroke` with `!important`
- [x] 1.6 Verify `yarn build:css` succeeds and utility classes are generated correctly

## 2. Flash Prevention & ERB Template

- [x] 2.1 Add inline `<script>` to `index.html.erb` that reads `localStorage.theme` and adds `.dark` class to `<html>` before paint
- [x] 2.2 Update `<body>` class in `index.html.erb` to use semantic token classes (`bg-surface-page text-primary`) instead of hardcoded `bg-neutral-50 text-neutral-900`

## 3. ThemeContext & App Wiring

- [x] 3.1 Create `ThemeContext.tsx` with `theme` state (`"light"` | `"dark"`) and `toggleTheme()` function that: adds `.transitioning` to `<html>`, toggles `.dark`, updates `localStorage.theme`, removes `.transitioning` after 300ms
- [x] 3.2 Wrap `App.tsx` with `ThemeProvider` (inside `QueryClientProvider`, outside `BrowserRouter`)
- [x] 3.3 Write test for ThemeContext: initial state reads from DOM, toggleTheme toggles `.dark` class and updates localStorage

## 4. Header — Toggle Button & Logo

- [x] 4.1 Add sun/moon toggle button to Header between navigation and user dropdown, consuming `useTheme()` from ThemeContext
- [x] 4.2 Add logo dark mode treatment: `rounded-lg overflow-hidden` wrapper with `dark:ring-1 dark:ring-white/10`
- [x] 4.3 Migrate all hardcoded neutral color classes in Header to semantic tokens
- [x] 4.4 Add `dark:` overrides for accent colors in Header (red logout hover)

## 5. Layout & Shared Components

- [x] 5.1 Migrate Layout.tsx to semantic tokens (if any direct color styling)
- [x] 5.2 Migrate EditableField.tsx to semantic tokens
- [x] 5.3 Migrate StatusSelect.tsx to semantic tokens + add `dark:` accent overrides
- [x] 5.4 Migrate UnitTypeSelect.tsx to semantic tokens
- [x] 5.5 Migrate ToastContainer.tsx to semantic tokens (if any direct color styling)

## 6. Item Cards (3 Variants)

- [x] 6.1 Migrate ItemCard.tsx (grid view) — replace neutral classes with semantic tokens, add `dark:` overrides for emerald drag states, amber note styling, shadow-to-ring replacement on dropdowns
- [x] 6.2 Migrate ItemCardCompact.tsx (list view) — same pattern as grid view
- [x] 6.3 Migrate ItemCardMoodboard.tsx (moodboard view) — semantic tokens for card chrome; verify `bg-black/50` overlay works in dark mode

## 7. Sections & Groups

- [x] 7.1 Migrate Section.tsx — semantic tokens for header/borders, `dark:` overrides for emerald drop zone states and amber note styling
- [x] 7.2 Migrate SectionGroupBlock.tsx to semantic tokens

## 8. Sidebar

- [x] 8.1 Migrate Sidebar.tsx — semantic tokens for project list items, hover states, active states, `dark:` overrides for emerald drag-and-drop states

## 9. Project View & Toolbar

- [x] 9.1 Migrate ProjectView.tsx to semantic tokens
- [x] 9.2 Migrate ProjectToolbar.tsx — semantic tokens for search input, filter dropdowns, view mode buttons

## 10. Add Item Form

- [x] 10.1 Migrate AddItemForm.tsx — semantic tokens for form inputs, select elements, tab styling, and `dark:` accent overrides for item type tabs

## 11. Settings Pages

- [x] 11.1 Migrate AccountSettings.tsx — semantic tokens for form inputs, success/error messages (`dark:` overrides for emerald/red)
- [x] 11.2 Migrate CategorySettings.tsx to semantic tokens
- [x] 11.3 Migrate DiscountSettings.tsx to semantic tokens
- [x] 11.4 Migrate DocumentSettings.tsx to semantic tokens
- [x] 11.5 Migrate StatusSettings.tsx to semantic tokens
- [x] 11.6 Migrate RichTextEditor.tsx to semantic tokens

## 12. Remaining Components & Pages

- [x] 12.1 Migrate ExtensionUpdateModal.tsx to semantic tokens
- [x] 12.2 Migrate FavoritesPage.tsx to semantic tokens (if any direct color styling)
- [x] 12.3 Migrate NewProjectPage.tsx to semantic tokens (if any direct color styling)

## 13. Testing & Verification

- [x] 13.1 Write Vitest tests for ThemeContext (toggle, localStorage persistence, transitioning class lifecycle)
- [x] 13.2 Write Vitest test for Header toggle button (renders correct icon per theme, click triggers toggleTheme)
- [ ] 13.3 Visually verify light mode is pixel-identical to pre-migration (side-by-side comparison)
- [ ] 13.4 Visually verify dark mode across all views: grid, list, moodboard
- [ ] 13.5 Visually verify dark mode in settings pages, add item form, sidebar
- [ ] 13.6 Verify smooth transition animation on toggle (no flash, no lingering transitions on navigation)
- [ ] 13.7 Verify no flash of wrong theme on page reload in both light and dark mode
- [x] 13.8 Verify avatar fallback circle is visible in dark mode (may need `dark:bg-neutral-200 dark:text-neutral-800`)
- [x] 13.9 Run existing test suites (`make test`, `yarn test:run`) to confirm no regressions
