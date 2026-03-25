## ADDED Requirements

### Requirement: Copy item from favorite via API
The system SHALL provide an endpoint `POST /api/v1/project_sections/:section_id/items/from_favorite/:item_id` that creates a copy of the specified item in the target section.

#### Scenario: Successful copy of a product
- **WHEN** an authenticated user sends POST to `/api/v1/project_sections/:section_id/items/from_favorite/:item_id` where the source item is a product they have access to
- **THEN** the system creates a new item in the target section with all fields copied (name, note, quantity, unit_type, unit_price_cents, original_unit_price_cents, currency, category, dimensions, status, external_url, discount_label, discount_percent, discount_code, thumbnail_url, item_type)
- **AND** returns the new item as JSON with status 201

#### Scenario: Successful copy of a contractor
- **WHEN** an authenticated user copies a contractor item from favorites
- **THEN** the system creates a new item with all contractor-specific fields copied (name, phone, address, unit_price_cents, status, item_type)
- **AND** returns the new item as JSON with status 201

#### Scenario: Source item has ActiveStorage attachment
- **WHEN** the source item has an attached file
- **THEN** the system creates an independent copy of the attachment blob on the new item

#### Scenario: Source item has no attachment
- **WHEN** the source item has no attached file
- **THEN** the new item has no attachment

#### Scenario: Unauthenticated request
- **WHEN** a request is sent without authentication
- **THEN** the system returns 401 Unauthorized

#### Scenario: Target section belongs to another user's project
- **WHEN** a user attempts to copy into a section they do not have access to
- **THEN** the system returns 404 Not Found

#### Scenario: Source item belongs to another user's project
- **WHEN** a user attempts to copy an item they do not have access to
- **THEN** the system returns 404 Not Found

#### Scenario: Source item does not exist
- **WHEN** a user attempts to copy a non-existent item ID
- **THEN** the system returns 404 Not Found

### Requirement: Copied item position
The copied item SHALL be appended at the end of the target section (last position).

#### Scenario: Position assignment
- **WHEN** an item is copied into a section that already has N items
- **THEN** the new item is assigned position N+1

#### Scenario: Copy into empty section
- **WHEN** an item is copied into an empty section
- **THEN** the new item is assigned position 1

### Requirement: Copied item does not inherit associations
The system SHALL NOT copy `ProductCaptureSample` records or `ItemFavorite` records to the new item.

#### Scenario: Capture samples not copied
- **WHEN** a product item with capture samples is copied
- **THEN** the new item has zero associated `ProductCaptureSample` records

#### Scenario: Favorites not copied
- **WHEN** a favorited item is copied
- **THEN** the new item is not favorited for any user

### Requirement: Favorites picker button in section
The section's add-item button bar SHALL include a ♥ button after the existing Produkt, Wykonawca, and Notatka buttons.

#### Scenario: Button visibility
- **WHEN** a section is displayed with its add-item button bar
- **THEN** a heart (♥) button appears as the last button in the bar

#### Scenario: Button click opens picker
- **WHEN** a user clicks the ♥ button
- **THEN** an inline favorites picker panel opens below the section items (in the same slot where AddItemForm renders)
- **AND** the add-item button bar is hidden

### Requirement: Favorites picker displays favorited items
The picker SHALL display the user's favorited products and contractors with thumbnail, name, price, and source project name.

#### Scenario: Picker shows favorites
- **WHEN** the picker is open and the user has favorited items
- **THEN** each favorite is displayed with its thumbnail (or placeholder icon), name, formatted price, and source project name

#### Scenario: Notes excluded from picker
- **WHEN** the user has favorited note items
- **THEN** note items are NOT shown in the picker

#### Scenario: Empty state
- **WHEN** the picker is open and the user has no favorited products or contractors
- **THEN** a message is displayed indicating no favorites are available

### Requirement: Favorites picker search filter
The picker SHALL provide a text input that filters displayed favorites by name.

#### Scenario: Filter by name
- **WHEN** a user types "MALM" in the search input
- **THEN** only favorites whose name contains "MALM" (case-insensitive) are displayed

#### Scenario: No matches
- **WHEN** a user types a search term that matches no favorites
- **THEN** no items are displayed

#### Scenario: Empty search
- **WHEN** the search input is empty
- **THEN** all favorites (excluding notes) are displayed

### Requirement: One-click add from picker
Clicking an item in the picker SHALL copy it into the current section and close the picker.

#### Scenario: Add item from picker
- **WHEN** a user clicks the add button on a favorite in the picker
- **THEN** the system sends POST to the from_favorite endpoint
- **AND** the new item appears in the section
- **AND** the picker closes

#### Scenario: Picker close without adding
- **WHEN** a user clicks the close (✕) button on the picker
- **THEN** the picker closes without adding any item
- **AND** the add-item button bar is shown again
