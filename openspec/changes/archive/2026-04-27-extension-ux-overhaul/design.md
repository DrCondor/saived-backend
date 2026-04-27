## Context

The SAIVED browser extension is a Manifest V3 Chrome extension using a native popup (`default_popup: "popup.html"`). All UI is in `popup.html` (380px wide, inline `<style>` block), logic in `popup.js` (~1070 lines), and page scraping in `content-script.js` (~1449 lines). Communication uses `chrome.tabs.sendMessage` (popup→content) and `sendResponse` callbacks. The price picker survives popup close/reopen via `chrome.storage.local` with tab ID validation.

Key constraint: Chrome destroys native popups when they lose focus. There is no background service worker — all state lives in popup.js, content-script.js, and chrome.storage.local.

## Goals / Non-Goals

**Goals:**
- Eliminate popup reload on every open (iframe persistence)
- Give users minimize/close controls; prevent accidental dismiss on outside click
- Offer side panel as alternative display mode for A/B testing
- Add intuitive image correction (click preview image → pick from page)
- Streamline the form by removing unused fields and the collapsible section

**Non-Goals:**
- Redesigning the visual style/theme of the extension
- Changing the scraping engine or learning system
- Adding new API endpoints or backend changes
- Supporting Firefox-specific APIs (Chrome-first, Firefox compatibility later)

## Decisions

### 1. Iframe injection via content script

**Choice:** Content script injects an `<iframe src="chrome.runtime.getURL('popup.html')">` wrapped in a host container div with window controls.

**Why not stay with native popup:** Chrome's popup API provides zero control over lifecycle — it destroys on blur, cannot be minimized, and reloads fully each time. An iframe in the page DOM persists across interactions.

**Why not a separate HTML file for the iframe:** Reusing `popup.html` means minimal code duplication. Extension pages loaded via `chrome.runtime.getURL()` retain full access to `chrome.tabs`, `chrome.storage`, and `chrome.runtime` APIs, so popup.js works largely unchanged.

**Architecture:**

```
┌─ Host page DOM ──────────────────────────────────┐
│                                                   │
│  ┌─ #saived-host (shadow DOM) ─────────────────┐ │
│  │                                              │ │
│  │  ┌─ .saived-container (position: fixed) ──┐ │ │
│  │  │  ┌─ .saived-titlebar ───────────────┐  │ │ │
│  │  │  │  SAIVED logo    [—] [✕]          │  │ │ │
│  │  │  └──────────────────────────────────┘  │ │ │
│  │  │  ┌─ iframe ────────────────────────┐   │ │ │
│  │  │  │  popup.html (extension origin)  │   │ │ │
│  │  │  │  full chrome.* API access       │   │ │ │
│  │  │  └─────────────────────────────────┘   │ │ │
│  │  └────────────────────────────────────────┘ │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Shadow DOM** isolates the extension's host container styles from the page. The iframe itself already has origin isolation.

**Manifest changes:**
- Remove `"default_popup"` from `action` (enables `action.onClicked` event)
- Add `popup.html` to `web_accessible_resources` (required for iframe src)
- Add background service worker (`background.js`) to handle `action.onClicked`

### 2. Icon click → toggle via background service worker

**Choice:** Add a minimal `background.js` service worker that listens for `chrome.action.onClicked` and sends a toggle message to the content script.

**Why a service worker is needed:** `action.onClicked` only fires when there's no `default_popup`. The content script can't listen for icon clicks directly. The service worker is a thin relay:

```
Icon click → background.js (action.onClicked)
           → chrome.tabs.sendMessage(tabId, { type: "SAIVED_TOGGLE" })
           → content-script.js toggles iframe visibility
```

The service worker is ~10 lines. No state, no persistence — pure relay.

### 3. Minimize and close behavior

**Choice:** Two buttons in the titlebar injected by the content script (outside the iframe).

| Action | Behavior |
|--------|----------|
| Minimize `[—]` | Hide container, show floating pill (small SAIVED icon, bottom-right) |
| Close `[✕]` | Hide container, remove floating pill. Next icon click re-shows. |
| Click floating pill | Re-show container (same as un-minimize) |
| Click outside | Nothing happens |
| Icon click (when visible) | Minimize |
| Icon click (when hidden) | Show |

**Why titlebar is outside iframe:** The content script owns the container lifecycle. Putting controls in the iframe would require cross-origin postMessage for simple show/hide. Keeping them in the host shadow DOM is simpler.

### 4. Side panel mode

**Choice:** Add `chrome.sidePanel` API support as an alternative, toggled from extension settings.

**Manifest additions:**
```json
"side_panel": { "default_path": "popup.html" },
"permissions": ["sidePanel"]
```

**Toggle mechanism:** A setting in the extension's config screen (where the API token is set). Stored in `chrome.storage.local` as `saived_display_mode: "floating" | "sidepanel"`.

When set to `"sidepanel"`:
- `background.js` calls `chrome.sidePanel.open({ tabId })` on icon click
- Content script does NOT inject iframe
- popup.html renders in side panel context (wider, adjusts layout via CSS media/container query)

When set to `"floating"` (default):
- Current iframe behavior

**Why same HTML for both:** The form layout works at both 380px (floating) and wider widths. A single CSS adjustment handles the side panel's variable width.

### 5. Image picker — reuse price picker pattern

**Choice:** Mirror the existing price picker UX exactly, triggered by clicking the preview image.

**Flow:**

```
User clicks preview image (in iframe)
  → iframe postMessage to content script: "SAIVED_START_IMAGE_PICKER"
  → content script creates overlay + instruction bar
  → hover: highlight <img> and elements with background-image
  → click: extract image URL + build selector
  → content script postMessage to iframe: "SAIVED_IMAGE_PICKED"
  → iframe updates thumbnail preview + thumb-input field
  → store discovered selector in captureContext
```

**Key difference from price picker:** No popup close/reopen cycle. Since the iframe persists, we use `window.postMessage` directly between content script and iframe instead of the storage-based workaround. This simplifies the flow significantly.

**Element detection (`looksLikeImage`):**
- `<img>` elements with src or srcset
- Elements with `background-image` CSS
- `<picture>` > `<source>` elements
- Minimum size filter (skip icons < 50x50px)
- Skip elements inside the SAIVED host container

**Overlay UI:** Same as price picker — fixed overlay, instruction bar at top ("🎯 Kliknij na zdjęcie produktu | ✕ Anuluj"), green highlight on hover, ESC to cancel.

### 6. Price picker adaptation for iframe context

**Choice:** Migrate price picker from storage-based to postMessage-based communication.

**Current flow (popup closes):**
1. Save form state + picker status to `chrome.storage.local`
2. Close popup
3. User picks price
4. Save result to storage
5. User reopens popup, result loaded from storage

**New flow (iframe stays open):**
1. Hide iframe (minimize)
2. Content script activates picker overlay
3. User picks price
4. Content script sends result via `postMessage` to iframe
5. Show iframe, update price field

**Backward compatibility:** The storage-based flow is removed. The iframe is always available to receive results directly.

### 7. Form layout restructure

**Choice:** Flatten all fields, remove collapsible, reorder.

**Removals:**
- Price from preview card (keep image + name only)
- `"(PLN)"` from price label → just `"Cena"`
- `"Popraw dane (jeśli błędne)"` header
- Status select (`#status-select`) → hardcode `"bez_statusu"` in submit payload
- Discount input (`#discount-input`) → remove from form and payload
- Category select (`#category-select`) → remove (auto-detected pills remain)
- `"Więcej opcji"` toggle button + collapsible wrapper

**New field order (all always visible):**
1. Preview card: image (clickable for picker) + name (fills space)
2. Nazwa produktu input
3. Cena + price picker btn + Ilość + Jednostka (existing row layout)
4. Category suggestion pills (auto-detected, unchanged)
5. Projekt + Sekcja selects (existing row layout)
6. Notatki textarea
7. Wymiary input
8. Miniaturka (URL) input
9. Link do produktu input
10. "Dodaj do SAIVED" button

**Preview card CSS change:** Remove `#price-preview` element. Change `.product-info` flex layout so name takes full width with more lines allowed (remove 2-line clamp or increase to 3).

### 8. Popup context detection

**Choice:** popup.js detects whether it's running as a native popup or inside an iframe and adapts behavior.

```javascript
const isIframe = window.self !== window.top;
```

**Differences by context:**
| Behavior | Native popup | Iframe |
|----------|-------------|--------|
| Price picker | storage-based, close popup | postMessage, minimize |
| Image picker | N/A (new feature) | postMessage |
| Window close | `window.close()` | postMessage to parent to hide |
| After submit | `window.close()` after 800ms | show success, stay open |

**Why keep dual-mode:** During development and debugging, the native popup mode is useful. Side panel mode also loads popup.html directly (not in an iframe). Context detection keeps all three modes working.

## Risks / Trade-offs

**[`web_accessible_resources` security]** → Making popup.html web-accessible means any page could technically load it in an iframe. Mitigation: popup.js already requires a valid API token from chrome.storage.local, which is only accessible from the extension's origin. No sensitive data is exposed by the HTML alone.

**[Shadow DOM CSS isolation]** → The host container uses shadow DOM to prevent page styles from affecting the titlebar/controls. The iframe has its own document context. Risk is minimal, but some aggressive page CSS (e.g., `* { all: unset !important }`) could theoretically leak. Mitigation: shadow DOM's closed mode prevents this.

**[Side panel API availability]** → `chrome.sidePanel` requires Chrome 114+. Mitigation: feature-detect with `if (chrome.sidePanel)` and hide the toggle in settings if unavailable.

**[postMessage origin validation]** → Messages between iframe and content script via postMessage need origin checking. Mitigation: validate `event.origin` matches `chrome.runtime.getURL('')` in content script, and validate `event.source` in iframe.

**[Increased content script size]** → Iframe injection + image picker + controls adds ~200-300 lines to content-script.js. The file is already 1449 lines. Mitigation: acceptable for now; can modularize later if needed.
