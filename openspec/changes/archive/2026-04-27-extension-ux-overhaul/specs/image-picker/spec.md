## ADDED Requirements

### Requirement: Image picker trigger
Clicking the product thumbnail in the preview card SHALL activate image picker mode. The preview image SHALL show a visual affordance (e.g., hover overlay with camera/picker icon) indicating it is clickable.

#### Scenario: User clicks preview image
- **WHEN** the user clicks the product thumbnail in the preview card
- **THEN** image picker mode is activated on the host page

#### Scenario: No thumbnail scraped
- **WHEN** no product image was found and the preview shows a placeholder icon
- **THEN** clicking the placeholder icon SHALL also activate image picker mode

### Requirement: Image picker overlay
When image picker mode is active, the content script SHALL display a fixed overlay with an instruction bar at the top reading "🎯 Kliknij na zdjęcie produktu | ✕ Anuluj". The overlay SHALL use the same visual style as the existing price picker overlay.

#### Scenario: Picker mode activates
- **WHEN** image picker mode starts
- **THEN** a fixed instruction bar appears at the top of the viewport with the instruction text and cancel button

#### Scenario: Iframe is hidden during picker
- **WHEN** image picker mode starts
- **THEN** the floating iframe container is minimized to allow the user to interact with the page

### Requirement: Image element highlighting
During image picker mode, hovering over image elements on the page SHALL highlight them with a green outline. Only elements that represent meaningful images SHALL be highlighted (minimum 50x50px, excluding the SAIVED extension container).

#### Scenario: Hover over img element
- **WHEN** the user hovers over an `<img>` element with dimensions >= 50x50px
- **THEN** the element is highlighted with a green outline (`3px solid #10b981`)

#### Scenario: Hover over element with background-image
- **WHEN** the user hovers over an element with a CSS `background-image` and dimensions >= 50x50px
- **THEN** the element is highlighted with a green outline

#### Scenario: Hover over small icon
- **WHEN** the user hovers over an image element smaller than 50x50px
- **THEN** no highlight is applied

#### Scenario: Hover over SAIVED container
- **WHEN** the user hovers over any element inside `#saived-host`
- **THEN** no highlight is applied

### Requirement: Image selection
Clicking a highlighted image element SHALL capture its URL and a CSS selector, then send the result to the iframe via `postMessage`.

#### Scenario: User clicks an img element
- **WHEN** the user clicks a highlighted `<img>` element
- **THEN** the image `src` (or highest-resolution `srcset` URL) is captured along with a robust CSS selector

#### Scenario: User clicks element with background-image
- **WHEN** the user clicks a highlighted element with `background-image`
- **THEN** the URL from the `background-image` CSS property is captured

#### Scenario: Result sent to iframe
- **WHEN** an image is selected
- **THEN** the content script sends a `postMessage` with type `SAIVED_IMAGE_PICKED` containing `{ url, selector }` to the iframe
- **AND** the picker overlay is cleaned up
- **AND** the iframe container is re-shown

### Requirement: Image picker cancellation
The user SHALL be able to cancel image picker mode by pressing ESC or clicking the cancel button in the instruction bar.

#### Scenario: User presses ESC
- **WHEN** image picker mode is active and the user presses ESC
- **THEN** picker mode is deactivated, the overlay is removed, and the iframe is re-shown without changes

#### Scenario: User clicks cancel button
- **WHEN** the user clicks "✕ Anuluj" in the instruction bar
- **THEN** picker mode is deactivated, the overlay is removed, and the iframe is re-shown without changes

### Requirement: Image result application
When the iframe receives an `SAIVED_IMAGE_PICKED` message, it SHALL update the preview thumbnail, the thumbnail URL input field, and store the discovered selector in the capture context.

#### Scenario: Image picked successfully
- **WHEN** the iframe receives `SAIVED_IMAGE_PICKED` with `{ url, selector }`
- **THEN** the preview thumbnail updates to show the new image
- **AND** the `#thumb-input` field is set to the image URL
- **AND** `captureContext.discovered_selectors.thumbnail_url` is set to the selector

### Requirement: Origin validation on postMessage
The iframe SHALL validate that incoming `postMessage` events originate from the expected source before processing them.

#### Scenario: Message from host page content script
- **WHEN** a `postMessage` is received and the origin matches the host page
- **THEN** the message is processed normally

#### Scenario: Message from unexpected origin
- **WHEN** a `postMessage` is received from an unexpected origin
- **THEN** the message is ignored
