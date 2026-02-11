## 1. URL Normalization & Storage Helpers

- [x] 1.1 Add `normalizePageUrl(url)` helper that returns `origin + pathname` (strips query params and hash)
- [x] 1.2 Add `saveFormState(pageUrl, formState, captureContext, scrapedProduct)` helper that writes to `saived_form_state` storage key with timestamp
- [x] 1.3 Add `loadFormState(currentPageUrl)` helper that reads from storage, checks URL match and 30-min TTL, returns state or null
- [x] 1.4 Add `clearFormState()` helper that removes `saived_form_state` from storage

## 2. Debounced Auto-Save

- [x] 2.1 Add `debouncedSaveFormState()` (500ms debounce) that collects current form field values and calls `saveFormState`
- [x] 2.2 Attach change/input listeners to all form fields (name, price, quantity, category, note) that trigger `debouncedSaveFormState`

## 3. Restore Logic on Popup Open

- [x] 3.1 In `initMainScreen`, after token validation and project loading, check price picker first (existing flow unchanged)
- [x] 3.2 If no price picker active, call `loadFormState` with current tab's normalized URL
- [x] 3.3 If valid state returned: populate form fields from saved state, skip `SAIVED_SCRAPE_PAGE` message to content script
- [x] 3.4 If no valid state (different page, expired, or first open): proceed with fresh scrape as before, then trigger initial save

## 4. Refresh Button

- [x] 4.1 Add refresh button element (⟳) in `popup.html` next to the domain pill
- [x] 4.2 Style the refresh button (small, unobtrusive, hover state)
- [x] 4.3 Add click handler: clear form state from storage, re-scrape page, save fresh state

## 5. Cleanup & Integration

- [x] 5.1 Clear `saived_form_state` after successful item submission (in the add-item success handler)
- [x] 5.2 After price picker restoration completes, let debounced auto-save capture the combined state into `saived_form_state`

## 6. Testing

- [x] 6.1 Write tests for `normalizePageUrl` — strips query params, hash, preserves origin + pathname
- [x] 6.2 Write tests for `saveFormState` / `loadFormState` — round-trip, URL mismatch returns null, expired state returns null
- [x] 6.3 Write tests for debounce behavior — multiple rapid calls result in single save
- [x] 6.4 Write test for restore flow — mock storage with valid state, verify form fields populated and scrape skipped
- [x] 6.5 Write test for refresh — verify storage cleared and scrape triggered

## 7. Version Bump & Backend Update

- [x] 7.1 Bump extension version in `manifest.json` (0.2.0 → 0.3.0)
- [ ] 7.2 Build updated extension zip (run `bin/update-extension`)
- [ ] 7.3 Update extension version reference and downloadable file in saived-backend (run `bin/update-extension`)
