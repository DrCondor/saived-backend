## Why

When users correct scraped data in the extension popup (e.g., fixing a wrong price), then click away to copy text from the page, the popup closes and all edits are lost. Reopening the extension re-scrapes everything from scratch. This is a critical usability issue — users lose work and must redo corrections every time the popup closes.

## What Changes

- Persist the full form state (name, price, quantity, category, note, thumbnail, external URL, capture context) to browser storage whenever the user edits a field
- On popup reopen, compare the current page URL (origin + pathname, ignoring query params) against saved state — restore if same page, fresh scrape if different
- Saved state expires after 30 minutes (TTL)
- Add a refresh button (⟳) next to the domain pill so users can explicitly re-scrape when needed
- Clear saved state after successful item submission
- Price picker flow remains unchanged and takes priority over general state restoration

## Capabilities

### New Capabilities
- `extension-form-persistence`: Persisting and restoring extension popup form state across open/close cycles on the same page

### Modified Capabilities

## Impact

- **Extension popup.js**: Main changes — URL normalization, storage read/write, debounced auto-save, restore logic, refresh button handler, cleanup on submit
- **Extension popup.html**: Add refresh button element and minimal styling
- **Extension content-script.js**: No changes needed — scraping is simply skipped when restoring
- **Backend**: Version bump needed after extension update; new extension zip uploaded for download
