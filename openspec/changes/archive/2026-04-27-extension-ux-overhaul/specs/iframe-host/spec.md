## ADDED Requirements

### Requirement: Iframe injection
The content script SHALL inject an iframe element with `src` set to `chrome.runtime.getURL('popup.html')` inside a shadow DOM host container attached to `document.body`. The host container SHALL use `position: fixed` and be positioned at the right side of the viewport. The iframe SHALL be 380px wide and sized to fit the popup content.

#### Scenario: Page loads with extension installed
- **WHEN** the content script runs on any page
- **THEN** a shadow DOM host element (`#saived-host`) is created and appended to `document.body` with the iframe and titlebar inside it

#### Scenario: Iframe loads popup.html
- **WHEN** the iframe src is set to `chrome.runtime.getURL('popup.html')`
- **THEN** popup.html loads with full access to `chrome.tabs`, `chrome.storage`, and `chrome.runtime` APIs

#### Scenario: Shadow DOM isolates styles
- **WHEN** the host page has CSS rules that would affect the extension container
- **THEN** the shadow DOM boundary prevents page styles from affecting the titlebar and container

### Requirement: Icon click toggles visibility
The extension icon click SHALL toggle the iframe container between visible and hidden states. A background service worker SHALL listen for `chrome.action.onClicked` and relay a `SAIVED_TOGGLE` message to the content script on the active tab.

#### Scenario: Icon clicked when iframe is hidden
- **WHEN** the user clicks the extension icon and the iframe container is not visible
- **THEN** the iframe container becomes visible

#### Scenario: Icon clicked when iframe is visible
- **WHEN** the user clicks the extension icon and the iframe container is visible
- **THEN** the iframe container is minimized (hidden, floating pill shown)

#### Scenario: Keyboard shortcut toggles
- **WHEN** the user presses the configured keyboard shortcut (Alt+Shift+S)
- **THEN** the same toggle behavior occurs as clicking the icon

### Requirement: Minimize button
The titlebar SHALL contain a minimize button `[—]` that hides the iframe container and shows a small floating pill (SAIVED icon) anchored to the bottom-right of the viewport.

#### Scenario: User clicks minimize
- **WHEN** the user clicks the minimize button
- **THEN** the iframe container is hidden and a small floating pill with the SAIVED icon appears at the bottom-right corner

#### Scenario: User clicks floating pill
- **WHEN** the user clicks the floating pill
- **THEN** the iframe container becomes visible again and the floating pill is hidden

### Requirement: Close button
The titlebar SHALL contain a close button `[✕]` that hides the iframe container without showing the floating pill.

#### Scenario: User clicks close
- **WHEN** the user clicks the close button
- **THEN** the iframe container is hidden and no floating pill is shown

#### Scenario: Reopen after close via icon
- **WHEN** the user clicks the extension icon after closing the extension
- **THEN** the iframe container becomes visible again

### Requirement: No auto-dismiss on outside click
Clicking anywhere outside the extension container SHALL NOT hide or close the extension.

#### Scenario: User clicks on the host page
- **WHEN** the iframe container is visible and the user clicks anywhere on the host page outside the container
- **THEN** the iframe container remains visible and unchanged

### Requirement: Iframe persistence across toggles
The iframe SHALL NOT be removed from the DOM when hidden. Toggling visibility SHALL only change the CSS `display` property of the container.

#### Scenario: Minimize and re-show
- **WHEN** the user minimizes and then re-shows the extension
- **THEN** the form state, scroll position, and all UI state within the iframe are preserved without any reload

### Requirement: Titlebar layout
The titlebar SHALL display the SAIVED logo/name on the left and minimize + close buttons on the right. The titlebar SHALL be draggable to reposition the floating window.

#### Scenario: Titlebar renders
- **WHEN** the iframe container is visible
- **THEN** a titlebar is shown above the iframe with "SAIVED" text on the left and `[—]` and `[✕]` buttons on the right

#### Scenario: Drag to reposition
- **WHEN** the user clicks and drags the titlebar
- **THEN** the entire container (titlebar + iframe) moves with the cursor and stays at the new position
