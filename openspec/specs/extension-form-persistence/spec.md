## ADDED Requirements

### Requirement: Form state auto-save
The extension SHALL automatically save the full form state (name, price, quantity, category, note, thumbnail URL, external URL, and capture context) to browser storage whenever the user edits any form field. Saves SHALL be debounced at 500ms. The saved state SHALL include the normalized page URL (origin + pathname) and a timestamp.

#### Scenario: User edits a field
- **WHEN** the user modifies any form field (name, price, quantity, category, note)
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

### Requirement: Saved state TTL expiration
Saved form state SHALL expire after 30 minutes. Expired state SHALL be treated as nonexistent.

#### Scenario: State older than 30 minutes
- **WHEN** the user reopens the popup on the same page but more than 30 minutes have passed since the last save
- **THEN** the saved state is discarded and a fresh scrape is performed

### Requirement: Refresh button
The extension SHALL provide a refresh button (⟳) next to the domain pill that allows the user to explicitly re-scrape the current page. Refreshing SHALL clear saved state and perform a fresh scrape.

#### Scenario: User clicks refresh
- **WHEN** the user clicks the refresh button
- **THEN** the saved form state is cleared, the page is re-scraped, and the form is populated with fresh scraped data

### Requirement: State cleanup on item submission
The extension SHALL clear saved form state after a successful item submission.

#### Scenario: Item added successfully
- **WHEN** the user successfully adds an item to a project section
- **THEN** the `saived_form_state` storage key is cleared

### Requirement: Price picker priority
The price picker flow SHALL take priority over general form state restoration. When a price pick is pending or completed, the existing price picker restoration flow SHALL execute. The general form state check SHALL only occur if no price picker action is active.

#### Scenario: Price picker completed, then popup reopened
- **WHEN** a price pick has been completed (status: "completed" in `saived_price_picker`)
- **THEN** the price picker restoration flow runs instead of general form state restoration

#### Scenario: No price picker active
- **WHEN** no price picker action is pending or completed
- **THEN** the extension checks `saived_form_state` for general restoration
