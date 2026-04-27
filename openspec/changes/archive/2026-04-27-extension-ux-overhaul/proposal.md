## Why

The browser extension popup reloads entirely every time the user clicks the icon (Chrome destroys native popups on blur), making it feel sluggish. The form is cluttered with rarely-used fields hidden behind a collapsible section, and correcting a wrong product image requires manually editing a URL. These friction points slow down the core workflow of capturing products from e-commerce sites.

## What Changes

- **BREAKING**: Migrate from native Chrome popup to content-script-injected iframe — the extension stays in the DOM and doesn't reload on toggle
- Add minimize and close buttons to the extension window; clicking outside no longer dismisses it
- Add side panel mode as an alternative to the floating window (for A/B testing which UX feels better)
- Add image picker mode (click preview image → hover/click images on page) mirroring the existing price picker pattern
- Remove fields from the form: status (hardcoded to `bez_statusu`), discount code, category select, "(PLN)" label suffix, price from preview
- Remove "Popraw dane (jeśli błędne)" header and "Więcej opcji" collapsible toggle
- Flatten all remaining fields to be always visible
- Move notes textarea to sit right after the primary fields (name, price, project/section)
- Preview card: remove price, let product name fill available space

## Capabilities

### New Capabilities
- `iframe-host`: Content-script-based iframe injection, minimize/close controls, toggle via icon click, no auto-dismiss on blur
- `side-panel-mode`: Chrome sidePanel API integration as alternative display mode, settings toggle between floating and docked
- `image-picker`: Click-on-preview-image trigger that enters a page-level picker mode (highlight images on hover, click to select), reusing the price picker UX pattern
- `compact-form-layout`: Reorganized form — removed fields, flattened sections, notes promoted to always-visible position after primary fields

### Modified Capabilities
- `extension-form-persistence`: Form state persistence must work within iframe context instead of native popup; status field no longer saved (always `bez_statusu`)

## Impact

- **Extension files**: `manifest.json` (remove `default_popup`, add `sidePanel`), `popup.html` (form restructure, add window controls), `popup.js` (iframe messaging, image picker logic), `content-script.js` (iframe injection, image picker overlay, minimize/close handling)
- **New file**: Likely a host script for iframe lifecycle management in the content script
- **No backend changes** — all changes are extension-side
- **No API changes** — status is set client-side before submission, category auto-detection unchanged
