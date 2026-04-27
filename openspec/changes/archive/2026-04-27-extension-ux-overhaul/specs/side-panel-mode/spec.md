## ADDED Requirements

### Requirement: Side panel registration
The extension manifest SHALL declare a side panel with `popup.html` as the default path. The extension SHALL request the `sidePanel` permission.

#### Scenario: Chrome supports sidePanel API
- **WHEN** the extension loads on Chrome 114+
- **THEN** the side panel is registered and available via `chrome.sidePanel`

#### Scenario: Chrome does not support sidePanel API
- **WHEN** the extension loads on a browser without `chrome.sidePanel`
- **THEN** the side panel toggle is hidden from settings and only floating mode is available

### Requirement: Display mode setting
The extension settings screen SHALL include a toggle to switch between `"floating"` (default) and `"sidepanel"` display modes. The selected mode SHALL be persisted in `chrome.storage.local` under key `saived_display_mode`.

#### Scenario: User selects side panel mode
- **WHEN** the user changes the display mode to `"sidepanel"` in settings
- **THEN** the value is saved to `chrome.storage.local` and takes effect on the next icon click

#### Scenario: Default mode
- **WHEN** no display mode has been set
- **THEN** the extension defaults to `"floating"` mode

### Requirement: Side panel activation
When display mode is `"sidepanel"`, clicking the extension icon SHALL open `popup.html` in Chrome's side panel instead of toggling the floating iframe.

#### Scenario: Icon click in sidepanel mode
- **WHEN** the display mode is `"sidepanel"` and the user clicks the extension icon
- **THEN** `chrome.sidePanel.open({ tabId })` is called and popup.html renders in the browser's side panel

#### Scenario: Icon click in floating mode
- **WHEN** the display mode is `"floating"` and the user clicks the extension icon
- **THEN** the content-script iframe toggle behavior is used (no side panel opened)

### Requirement: Layout adaptation
popup.html SHALL adapt its layout to the available width when rendered in the side panel. The form layout SHALL remain functional at widths from 380px to the side panel's variable width.

#### Scenario: Side panel is wider than 380px
- **WHEN** popup.html renders in a side panel wider than 380px
- **THEN** the form fields expand to use available width while maintaining the same field order and structure
