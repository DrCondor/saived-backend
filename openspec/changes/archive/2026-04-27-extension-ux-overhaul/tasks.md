## 1. Form Cleanup (compact-form-layout)

- [x] 1.1 Remove price from preview card — delete `#price-preview` element and its container; adjust `.product-info` CSS so name fills full width, increase line clamp from 2 to 3
- [x] 1.2 Remove "Popraw dane (jeśli błędne)" header from the edit section
- [x] 1.3 Remove "(PLN)" from price label — change "Cena (PLN)" to "Cena"
- [x] 1.4 Remove status select (`#status-select`), discount input (`#discount-input`), and category select (`#category-select`) from HTML; keep category suggestion pills
- [x] 1.5 Remove "Więcej opcji" toggle button (`#extra-fields-trigger`) and collapsible wrapper (`#extra-fields`) — make all inner fields always visible
- [x] 1.6 Reorder fields: move Notatki textarea to appear after Projekt/Sekcja row, then Wymiary, Miniaturka URL, Link do produktu
- [x] 1.7 Hardcode `status: "bez_statusu"` in the submit payload (popup.js); remove `discount_label` from payload; keep category from pills only
- [x] 1.8 Remove status, discount, and category from form state save/restore in popup.js and formState.js
- [x] 1.9 Test: verify form renders all fields without collapsible, submit sends correct payload, form state saves/restores without removed fields

## 2. Background Service Worker

- [x] 2.1 Create `background.js` — listen for `chrome.action.onClicked`, read `saived_display_mode` from storage, send `SAIVED_TOGGLE` to content script (floating mode) or call `chrome.sidePanel.open()` (sidepanel mode)
- [x] 2.2 Update `manifest.json` — add `"background": { "service_worker": "background.js" }`, remove `"default_popup"` from action, add `popup.html` to `web_accessible_resources`
- [x] 2.3 Test: verify icon click sends toggle message to content script, keyboard shortcut still works

## 3. Iframe Host (content-script injection)

- [x] 3.1 Add iframe injection to content-script.js — create shadow DOM host (`#saived-host`), inject container with titlebar and iframe (`chrome.runtime.getURL('popup.html')`)
- [x] 3.2 Implement titlebar with SAIVED logo/name on left, minimize `[—]` and close `[✕]` buttons on right
- [x] 3.3 Implement minimize behavior — hide container, show floating pill (SAIVED icon at bottom-right); click pill to re-show
- [x] 3.4 Implement close behavior — hide container, no floating pill; next icon click re-shows
- [x] 3.5 Handle `SAIVED_TOGGLE` message from background.js — toggle container visibility (show if hidden, minimize if visible)
- [x] 3.6 Implement titlebar drag-to-reposition — mousedown/mousemove/mouseup on titlebar moves the container
- [x] 3.7 Ensure clicking outside the extension container does not dismiss it
- [x] 3.8 Test: verify iframe persists across minimize/show cycles (form state, scroll position preserved), drag works, outside clicks ignored

## 4. Popup.js Iframe Adaptation

- [x] 4.1 Add iframe context detection (`const isIframe = window.self !== window.top`)
- [x] 4.2 Replace `window.close()` calls — in iframe mode, send postMessage to parent to minimize/hide instead
- [x] 4.3 After successful item submission — in iframe mode, show success message and stay open (don't close)
- [x] 4.4 Set up `window.addEventListener('message', ...)` in iframe to receive `SAIVED_PRICE_PICKED` and `SAIVED_IMAGE_PICKED` messages with origin validation
- [x] 4.5 Test: verify popup.js works in both native popup mode (for debugging) and iframe mode

## 5. Price Picker Migration (postMessage)

- [x] 5.1 Modify price picker activation in popup.js — instead of saving to storage and closing popup, send `SAIVED_START_PRICE_PICKER` via postMessage to parent, then request minimize
- [x] 5.2 Update content-script.js price picker completion — instead of saving result to `chrome.storage.local`, send `SAIVED_PRICE_PICKED` postMessage to iframe with `{ price, rawText, selector }`
- [x] 5.3 Handle `SAIVED_PRICE_PICKED` in popup.js message listener — update price field, store discovered selector, re-show iframe
- [x] 5.4 Remove storage-based price picker flow — delete `saived_price_picker` key usage, remove picker state check on popup init
- [x] 5.5 Test: verify price picker works end-to-end via postMessage (pick price, result applied, iframe re-shown)

## 6. Image Picker

- [x] 6.1 Add click handler on preview image in popup.js — send `SAIVED_START_IMAGE_PICKER` postMessage to parent, request minimize
- [x] 6.2 Add visual hover affordance on preview image (camera/picker icon overlay on hover) indicating it's clickable
- [x] 6.3 Implement `startImagePickerMode()` in content-script.js — create overlay + instruction bar ("🎯 Kliknij na zdjęcie produktu | ✕ Anuluj"), same style as price picker
- [x] 6.4 Implement `looksLikeImage()` detection — match `<img>` with src/srcset, elements with `background-image`, `<picture>` sources; filter out elements < 50x50px and elements inside `#saived-host`
- [x] 6.5 Add hover highlighting (green outline `3px solid #10b981`) and click handler to capture image URL + build robust selector
- [x] 6.6 On image selection — send `SAIVED_IMAGE_PICKED` postMessage to iframe with `{ url, selector }`, clean up overlay, re-show iframe
- [x] 6.7 Handle `SAIVED_IMAGE_PICKED` in popup.js — update `#thumb-preview`, set `#thumb-input` value, store selector in `captureContext.discovered_selectors.thumbnail_url`
- [x] 6.8 Implement cancellation (ESC key + cancel button) — remove overlay, re-show iframe without changes
- [x] 6.9 Test: verify image picker highlights correct elements, captures URL, updates preview and form, cancel works

## 7. Side Panel Mode

- [x] 7.1 Update `manifest.json` — add `"side_panel": { "default_path": "popup.html" }` and `"sidePanel"` to permissions
- [x] 7.2 Add display mode toggle to settings screen in popup.html — radio/toggle between "Pływające okno" (floating) and "Panel boczny" (side panel), saved to `chrome.storage.local` as `saived_display_mode`
- [x] 7.3 Update background.js — check display mode on icon click; call `chrome.sidePanel.open({ tabId })` for sidepanel mode
- [x] 7.4 In content-script.js — skip iframe injection when display mode is `"sidepanel"`; feature-detect `chrome.sidePanel` and hide toggle if unavailable
- [x] 7.5 Add CSS for wider layout — popup.html adapts to variable width using `width: 100%` with `min-width: 380px` when in side panel context
- [x] 7.6 Test: verify side panel opens popup.html, form is usable at wider widths, toggle persists between sessions
