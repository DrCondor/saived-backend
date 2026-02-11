## Context

The SAIVED browser extension popup (`popup.js`) is completely stateless between open/close cycles. Every popup open triggers a full re-scrape of the current page via content script messaging. The only persisted data is the API token and last selected project/section.

The price picker already implements a narrow version of this pattern — it saves form state to `saived_price_picker` storage key before closing, then restores on reopen. This proves the approach works but is limited to the price picker flow.

The extension is a Chrome/Firefox extension with `popup.html`/`popup.js` (popup), `content-script.js` (page scraping), and `manifest.json`.

## Goals / Non-Goals

**Goals:**
- Preserve user edits when popup is reopened on the same page
- Fresh scrape when navigating to a different page
- Explicit refresh capability for re-scraping the current page
- 30-minute TTL so stale edits don't surprise users

**Non-Goals:**
- Persisting state across browser restarts (storage.local already handles this, but TTL will expire)
- Syncing state between multiple tabs
- Changing the content script or scraping logic
- Modifying the price picker's existing flow

## Decisions

### 1. URL comparison: origin + pathname only

**Decision**: Compare `new URL(url).origin + new URL(url).pathname` to determine "same page."

**Alternatives considered**:
- Exact URL match — too strict, tracking params (`?utm_source=...`) would cause unnecessary re-scrapes
- Domain-only match — too loose, different products on the same domain would restore wrong data

**Rationale**: Origin + pathname captures the meaningful page identity. Query params and hashes are typically tracking, filter, or UI state that don't change the product being viewed.

### 2. Single storage key (`saived_form_state`)

**Decision**: Store form state under one key that gets overwritten each time.

**Rationale**: Users work on one product at a time in the extension. Multi-tab state would add complexity with no clear use case. If they switch tabs, the URL won't match and a fresh scrape happens.

### 3. Debounced auto-save (500ms)

**Decision**: Save to storage on every form field change, debounced at 500ms.

**Alternatives considered**:
- Save on popup close (`beforeunload`) — unreliable in extension popups, events may not fire
- Save on explicit button click — defeats the purpose, users won't remember to save before clicking away

**Rationale**: Debounced auto-save is cheap (small JSON to storage.local) and reliable. Users never need to think about saving.

### 4. Price picker takes priority

**Decision**: On popup open, check `saived_price_picker` first. If a price pick is pending/completed, use existing price picker restoration flow. Otherwise, fall through to general form state restoration.

**Rationale**: Price picker is a specific user-initiated action. The user explicitly started it, so its result should not be overridden by general state restoration. After price picker restores and applies, the debounced auto-save will capture the combined state into `saived_form_state`.

### 5. Refresh button placement

**Decision**: Small `⟳` icon button next to the domain pill in the popup header.

**Rationale**: Visible enough to find, small enough to not interfere with the main workflow. Placed near the domain indicator since "refresh" is conceptually tied to "re-read this page."

## Risks / Trade-offs

- **[Storage quota]** → Minimal risk. `storage.local` has 10MB+ limit; form state is a few KB at most.
- **[Stale thumbnail URL]** → If a product page changes its image URL, the cached thumbnail may be outdated. Mitigated by 30-min TTL and refresh button.
- **[Price picker + general state interaction]** → After price picker completes, auto-save kicks in and saves the combined state. If user closes popup again (without adding item), next open will restore from general state (which includes the picked price). This is correct behavior.
- **[SPA navigation within popup]** → Not applicable; the popup doesn't navigate, it's a single page.
