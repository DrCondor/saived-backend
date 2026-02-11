## ADDED Requirements

### Requirement: Soft delete for project items
The system SHALL soft-delete project items by setting a `deleted_at` timestamp instead of destroying the record. Soft-deleted items SHALL be excluded from all standard queries and API responses.

#### Scenario: Item soft-deleted on destroy
- **WHEN** a project item is deleted via the API
- **THEN** the item's `deleted_at` SHALL be set to the current timestamp and the item SHALL NOT be destroyed from the database

#### Scenario: Soft-deleted items excluded from project responses
- **WHEN** a project is fetched via `GET /api/v1/projects/:id`
- **THEN** items with a non-null `deleted_at` SHALL NOT appear in the sections' items arrays

#### Scenario: Soft-deleted items excluded from favorites
- **WHEN** favorites are listed via `GET /api/v1/favorites`
- **THEN** items with a non-null `deleted_at` SHALL NOT appear in the response

### Requirement: Soft delete for project sections
The system SHALL soft-delete project sections by setting a `deleted_at` timestamp instead of destroying the record. Soft-deleted sections SHALL be excluded from all standard queries and API responses.

#### Scenario: Section soft-deleted on destroy
- **WHEN** a project section is deleted via the API
- **THEN** the section's `deleted_at` SHALL be set to the current timestamp and the section SHALL NOT be destroyed

#### Scenario: Cascading soft delete to items
- **WHEN** a project section is soft-deleted
- **THEN** all active items in that section SHALL have their `deleted_at` set to the same timestamp as the section

#### Scenario: Soft-deleted sections excluded from project responses
- **WHEN** a project is fetched via the API
- **THEN** sections with a non-null `deleted_at` SHALL NOT appear in the response

### Requirement: Soft delete for section groups
The system SHALL soft-delete section groups by setting a `deleted_at` timestamp instead of destroying the record. Soft-deleted groups SHALL be excluded from all standard queries and API responses.

#### Scenario: Group soft-deleted on destroy
- **WHEN** a section group is deleted via the API
- **THEN** the group's `deleted_at` SHALL be set to the current timestamp and the group SHALL NOT be destroyed

#### Scenario: Cascading soft delete to sections and items
- **WHEN** a section group is soft-deleted
- **THEN** all active sections in that group SHALL have their `deleted_at` set to the same timestamp, and all active items in those sections SHALL also have their `deleted_at` set to the same timestamp

#### Scenario: Soft-deleted groups excluded from project responses
- **WHEN** a project is fetched via the API
- **THEN** section groups with a non-null `deleted_at` SHALL NOT appear in the response

### Requirement: Restore soft-deleted items
The system SHALL provide an API endpoint to restore a soft-deleted project item.

**Endpoint**: `POST /api/v1/project_sections/:section_id/items/:id/restore`

#### Scenario: Successful item restore
- **WHEN** a restore request is made for a soft-deleted item that belongs to the authenticated user's project
- **THEN** the item's `deleted_at` SHALL be set to null and the API SHALL return the restored item as JSON with status 200

#### Scenario: Restore item in soft-deleted section
- **WHEN** a restore request is made for an item whose parent section is also soft-deleted
- **THEN** the API SHALL return 422 with an error message indicating the parent section must be restored first

#### Scenario: Restore non-deleted item
- **WHEN** a restore request is made for an item that is not soft-deleted
- **THEN** the API SHALL return 422 with an error message

#### Scenario: Unauthorized restore
- **WHEN** a restore request is made without authentication
- **THEN** the API SHALL return 401

#### Scenario: Item not found
- **WHEN** a restore request is made for a non-existent item ID
- **THEN** the API SHALL return 404

### Requirement: Restore soft-deleted sections
The system SHALL provide an API endpoint to restore a soft-deleted project section and all items that were cascade-deleted with it.

**Endpoint**: `POST /api/v1/projects/:project_id/sections/:id/restore`

#### Scenario: Successful section restore with cascaded items
- **WHEN** a restore request is made for a soft-deleted section
- **THEN** the section's `deleted_at` SHALL be set to null, all items with the same `deleted_at` timestamp SHALL be restored, and the API SHALL return the section with its restored items as JSON with status 200

#### Scenario: Individually deleted items not restored
- **WHEN** a section is restored that contained items deleted individually before the section was deleted
- **THEN** only items whose `deleted_at` matches the section's original `deleted_at` SHALL be restored; individually deleted items SHALL remain soft-deleted

#### Scenario: Restore section in soft-deleted group
- **WHEN** a restore request is made for a section whose parent group is also soft-deleted
- **THEN** the API SHALL return 422 with an error message indicating the parent group must be restored first

### Requirement: Restore soft-deleted section groups
The system SHALL provide an API endpoint to restore a soft-deleted section group and all sections and items that were cascade-deleted with it.

**Endpoint**: `POST /api/v1/projects/:project_id/section_groups/:id/restore`

#### Scenario: Successful group restore with cascaded sections and items
- **WHEN** a restore request is made for a soft-deleted section group
- **THEN** the group's `deleted_at` SHALL be set to null, all sections with the same `deleted_at` timestamp SHALL be restored, all items in those sections with the same `deleted_at` SHALL be restored, and the API SHALL return the group with its restored sections and items as JSON with status 200

#### Scenario: Individually deleted children not restored
- **WHEN** a group is restored that contained sections or items deleted individually before the group was deleted
- **THEN** only records whose `deleted_at` matches the group's original `deleted_at` SHALL be restored

### Requirement: Cleanup of soft-deleted records
The system SHALL provide a mechanism to permanently delete soft-deleted records older than 1 hour.

#### Scenario: Records older than 1 hour are hard-deleted
- **WHEN** the cleanup process runs
- **THEN** all project items, sections, and section groups with `deleted_at` older than 1 hour SHALL be permanently destroyed from the database

#### Scenario: Records newer than 1 hour are preserved
- **WHEN** the cleanup process runs
- **THEN** soft-deleted records with `deleted_at` within the last hour SHALL NOT be destroyed

#### Scenario: Cleanup order prevents orphan callbacks
- **WHEN** the cleanup process runs
- **THEN** items SHALL be destroyed before sections, and sections before groups, to avoid cascading destroy callbacks on already-deleted children
