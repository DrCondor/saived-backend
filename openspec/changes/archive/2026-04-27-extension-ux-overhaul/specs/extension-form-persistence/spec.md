## MODIFIED Requirements

### Requirement: Form state auto-save
The extension SHALL automatically save the full form state (name, price, quantity, note, thumbnail URL, external URL, dimensions, and capture context) to browser storage whenever the user edits any form field. Saves SHALL be debounced at 500ms. The saved state SHALL include the normalized page URL (origin + pathname) and a timestamp. The status field SHALL NOT be included in saved state (it is always `"bez_statusu"`). The discount and category fields SHALL NOT be included in saved state (discount is removed; category is auto-detected only).

#### Scenario: User edits a field
- **WHEN** the user modifies any form field (name, price, quantity, note, dimensions, thumbnail URL, product URL)
- **THEN** the full form state is saved to `browserApi.storage.local` under key `saived_form_state` within 500ms

#### Scenario: Rapid edits are debounced
- **WHEN** the user types multiple characters in quick succession
- **THEN** only one save occurs 500ms after the last keystroke

### Requirement: Form state restoration on same page
The extension SHALL restore saved form state when the popup is reopened on the same page (matching origin + pathname, ignoring query params and hash). The extension SHALL skip scraping the page when restoring.

#### Scenario: Reopen on same page within TTL
- **WHEN** the user closes the popup and reopens it on the same page within 30 minutes
- **THEN** the form fields are populated from saved state and no scrape message is sent to the content script

#### Scenario: Reopen on different page
- **WHEN** the user opens the popup on a page with a different origin or pathname than the saved state
- **THEN** the extension performs a fresh scrape and discards the old saved state

#### Scenario: Query params and hash are ignored
- **WHEN** the saved state URL is `https://mybed.pl/lozko-xyz` and the current page is `https://mybed.pl/lozko-xyz?ref=google#section`
- **THEN** the URLs are considered the same page and form state is restored

### Requirement: Price picker uses postMessage
The price picker flow SHALL use `postMessage` communication between the content script and the iframe instead of the storage-based workaround. When price picker mode is activated, the iframe SHALL be minimized. When the user picks a price, the content script SHALL send the result directly to the iframe via `postMessage`. The storage-based picker flow (`saived_price_picker` key) SHALL be removed.

#### Scenario: Price picker activated
- **WHEN** the user clicks the price picker button
- **THEN** the iframe is minimized and the price picker overlay appears on the page

#### Scenario: Price picked
- **WHEN** the user clicks on a price element during picker mode
- **THEN** the content script sends a `postMessage` with type `SAIVED_PRICE_PICKED` containing `{ price, rawText, selector }` to the iframe
- **AND** the iframe is re-shown with the price field updated

#### Scenario: Price picker cancelled
- **WHEN** the user presses ESC or clicks cancel during picker mode
- **THEN** the iframe is re-shown without changes

## REMOVED Requirements

### Requirement: Price picker priority
**Reason**: The storage-based price picker flow is replaced by direct postMessage communication. There is no longer a separate picker restoration step that competes with general form state restoration.
**Migration**: Price picker results are delivered instantly via postMessage to the persistent iframe. The `saived_price_picker` storage key and its associated check-on-popup-open logic are removed entirely.
