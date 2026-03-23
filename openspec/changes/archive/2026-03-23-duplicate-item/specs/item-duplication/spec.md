## ADDED Requirements

### Requirement: Duplicate item via API
The system SHALL provide an endpoint `POST /api/v1/project_sections/:section_id/items/:id/duplicate` that creates an exact copy of the specified item within the same section.

#### Scenario: Successful duplication of a product
- **WHEN** an authenticated user sends POST to `/api/v1/project_sections/:section_id/items/:id/duplicate` for a product item they own
- **THEN** the system creates a new item with all fields copied (name, note, quantity, unit_type, unit_price_cents, original_unit_price_cents, currency, category, dimensions, status, external_url, discount_label, discount_percent, discount_code, thumbnail_url, item_type)
- **AND** returns the new item as JSON with status 201

#### Scenario: Successful duplication of a contractor
- **WHEN** an authenticated user duplicates a contractor item
- **THEN** the system creates a new item with all contractor-specific fields copied (name, phone, address, unit_price_cents, status, item_type)
- **AND** returns the new item as JSON with status 201

#### Scenario: Successful duplication of a note
- **WHEN** an authenticated user duplicates a note item
- **THEN** the system creates a new item with name, note, status, and item_type copied
- **AND** returns the new item as JSON with status 201

#### Scenario: Unauthenticated request
- **WHEN** a request is sent without authentication
- **THEN** the system returns 401 Unauthorized

#### Scenario: Item belongs to another user's project
- **WHEN** a user attempts to duplicate an item in a section they do not have access to
- **THEN** the system returns 404 Not Found

#### Scenario: Item does not exist
- **WHEN** a user attempts to duplicate a non-existent item ID
- **THEN** the system returns 404 Not Found

### Requirement: Duplicate preserves position order
The duplicated item SHALL be inserted immediately after the original item in position order within the same section.

#### Scenario: Position insertion
- **WHEN** an item at position N is duplicated
- **THEN** the new item is assigned position N+1
- **AND** all existing items with position > N have their positions incremented by 1

#### Scenario: Position integrity after multiple duplications
- **WHEN** the same item is duplicated twice
- **THEN** each duplicate appears after the previous one in order
- **AND** no two items in the section share the same position

### Requirement: Duplicate copies ActiveStorage attachments
When the original item has an attached file, the system SHALL create an independent copy of the attachment blob on the duplicate.

#### Scenario: Item with attachment
- **WHEN** a contractor item with an attachment is duplicated
- **THEN** the duplicate has its own attachment with the same filename and content
- **AND** deleting the original item does not affect the duplicate's attachment

#### Scenario: Item without attachment
- **WHEN** an item without an attachment is duplicated
- **THEN** the duplicate has no attachment

### Requirement: Duplicate does not copy associated records
The system SHALL NOT copy `ProductCaptureSample` records or `ItemFavorite` records to the duplicate.

#### Scenario: Capture samples not copied
- **WHEN** a product item with capture samples is duplicated
- **THEN** the duplicate has zero associated `ProductCaptureSample` records

#### Scenario: Favorites not copied
- **WHEN** a favorited item is duplicated
- **THEN** the duplicate is not favorited for any user
- **AND** the `favorite` field in the response is `false`

### Requirement: Duplicate button in grid view
The `ItemCard` component (grid view) SHALL display a duplicate button in the hover action panel, positioned between the favorite and delete buttons.

#### Scenario: Button visibility
- **WHEN** a user hovers over an item card in grid view
- **THEN** the action panel shows three buttons: favorite (heart), duplicate (copy icon), delete (trash)

#### Scenario: Button click triggers duplication
- **WHEN** a user clicks the duplicate button
- **THEN** a new item appears in the section immediately after the original
- **AND** the section total updates to reflect the new item

### Requirement: Duplicate button in list view
The `ItemCardCompact` component (list view) SHALL display a duplicate button in the hover action panel, positioned between the favorite and delete buttons.

#### Scenario: Button visibility
- **WHEN** a user hovers over an item row in list view
- **THEN** the action panel shows three buttons: favorite, duplicate, delete

#### Scenario: Button click triggers duplication
- **WHEN** a user clicks the duplicate button in list view
- **THEN** a new item row appears in the section immediately after the original

### Requirement: Undo support for duplication
Duplicating an item SHALL push an entry to the undo stack that allows reversing the action.

#### Scenario: Undo a duplication
- **WHEN** a user duplicates an item and then triggers undo
- **THEN** the duplicate is deleted
- **AND** section totals revert to pre-duplication values

#### Scenario: Redo a duplication
- **WHEN** a user undoes a duplication and then triggers redo
- **THEN** a new duplicate is created again
