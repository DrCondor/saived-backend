## ADDED Requirements

### Requirement: Duplicate project via API
The system SHALL provide an endpoint `POST /api/v1/projects/:id/duplicate` that creates a deep copy of the specified project owned by the current user.

#### Scenario: Successful duplication by owner
- **WHEN** an authenticated user sends POST to `/api/v1/projects/:id/duplicate` for a project they own
- **THEN** the system creates a new `Project` with `owner_id` equal to the current user's id
- **AND** the new project's `name` is `"<original name> (kopia)"`
- **AND** the new project's `description` is copied from the source
- **AND** the new project's `favorite` is `false`
- **AND** the new project's `position` is `nil`
- **AND** the system creates one `ProjectMembership` row with `role: "owner"` linking the current user to the new project
- **AND** the response status is `201 Created`
- **AND** the response body is the new project's full JSON (same shape as `GET /api/v1/projects/:id`)
- **AND** the response JSON includes `is_owner: true`

#### Scenario: Unauthenticated request
- **WHEN** a request is sent to `POST /api/v1/projects/:id/duplicate` without authentication
- **THEN** the system returns `401 Unauthorized`

#### Scenario: Non-owner member attempts duplication
- **WHEN** an authenticated user with a `ProjectMembership` of role `editor` or `viewer` (not `owner`) sends POST to `/api/v1/projects/:id/duplicate`
- **THEN** the system returns `403 Forbidden`
- **AND** no new `Project`, `ProjectSection`, `ProjectItem`, `SectionGroup`, or `ProjectMembership` rows are created

#### Scenario: Foreign project
- **WHEN** an authenticated user with no membership on the source project sends POST to `/api/v1/projects/:id/duplicate`
- **THEN** the system returns `404 Not Found`

#### Scenario: Non-existent project id
- **WHEN** an authenticated user sends POST to `/api/v1/projects/:id/duplicate` for a project id that does not exist
- **THEN** the system returns `404 Not Found`

### Requirement: Duplicate copies active sections and section groups
The system SHALL copy every non-soft-deleted `ProjectSection` and `SectionGroup` from the source to the new project, preserving structural attributes and remapping `section_group_id` references.

#### Scenario: Sections and groups copied verbatim
- **WHEN** a project with N active section groups and M active sections is duplicated
- **THEN** the new project has exactly N `SectionGroup` rows with the same `name` and `position` as the source's groups
- **AND** the new project has exactly M `ProjectSection` rows with the same `name` and `position` as the source's sections
- **AND** each new section's `section_group_id` references the corresponding NEW group (not the source's group id)
- **AND** sections that had `section_group_id: nil` on the source remain `section_group_id: nil` on the duplicate

#### Scenario: Soft-deleted sections excluded
- **WHEN** the source project has a section with `deleted_at` not nil
- **THEN** that section is NOT copied to the new project
- **AND** the new project's section count equals `source.sections.active.count`

#### Scenario: Soft-deleted section groups excluded
- **WHEN** the source project has a section group with `deleted_at` not nil
- **THEN** that group is NOT copied to the new project
- **AND** any sections that referenced the deleted group are either themselves soft-deleted (and skipped) or have their `section_group_id` left nil on the duplicate if the group was deleted but the section was not

### Requirement: Duplicate copies active items verbatim
The system SHALL copy every non-soft-deleted `ProjectItem` from each copied section, preserving all descriptive item attributes including `position`.

#### Scenario: Item attributes copied
- **WHEN** an active item exists on a copied section
- **THEN** a new `ProjectItem` is created on the corresponding new section with the following attributes copied verbatim from the source: `item_type`, `name`, `note`, `quantity`, `unit_type`, `unit_price_cents`, `currency`, `original_unit_price_cents`, `discount_label`, `discount_percent`, `discount_code`, `category`, `dimensions`, `status`, `position`, `external_url`, `thumbnail_url`, `phone`, `address`

#### Scenario: Negative contractor position preserved
- **WHEN** the source has a contractor item with `position: -2`
- **THEN** the duplicate of that item also has `position: -2`
- **AND** the `before_create :set_position` callback does NOT recompute the position

#### Scenario: Soft-deleted items excluded
- **WHEN** the source section has an item with `deleted_at` not nil
- **THEN** that item is NOT copied to the new section
- **AND** the new section's item count equals the source section's `items.active.count`

#### Scenario: Capture samples not copied
- **WHEN** a source item has associated `ProductCaptureSample` rows
- **THEN** the duplicated item has zero `ProductCaptureSample` rows

#### Scenario: Favorites not copied
- **WHEN** the current user (or any other user) has favorited a source item via `ItemFavorite`
- **THEN** no `ItemFavorite` rows are created for the duplicated item
- **AND** the response JSON shows `favorite: false` for the duplicated item

#### Scenario: ActiveStorage attachments not copied
- **WHEN** a source contractor item has an attached file via `has_one_attached :attachment`
- **THEN** the duplicated item has no attachment
- **AND** `attachment_url` and `attachment_filename` in the response JSON are `null`

### Requirement: Default section auto-creation suppressed during duplication
The system SHALL NOT create a default `"Nowa sekcja"` section on the duplicated project. The `Project#create_default_section` `after_create` callback SHALL be suppressed for the duration of the duplication.

#### Scenario: No stray default section
- **WHEN** a project is duplicated
- **THEN** the new project's section count equals the source's active section count exactly (not source count + 1)
- **AND** no section named `"Nowa sekcja"` is created unless the source itself had one

#### Scenario: Suppression mechanism is thread-safe
- **WHEN** duplication is in progress in one request thread
- **THEN** other concurrent threads creating new projects via `POST /api/v1/projects` SHALL still receive a default section
- **AND** the suppression flag is cleared at the end of the duplication transaction even if an exception is raised

### Requirement: Duplication is atomic
The system SHALL wrap the entire duplication in a single database transaction. Any failure mid-copy SHALL leave no partial new project, sections, items, groups, or memberships.

#### Scenario: Mid-stream failure rolls back everything
- **WHEN** the duplication transaction raises an exception after some rows have been created
- **THEN** zero new `Project`, `ProjectSection`, `ProjectItem`, `SectionGroup`, and `ProjectMembership` rows exist when the transaction completes
- **AND** the source project and all its records remain unchanged

### Requirement: Project list and show JSON expose `is_owner`
The system SHALL include an `is_owner: boolean` field on each project in the `GET /api/v1/projects` (index) and `GET /api/v1/projects/:id` (show) responses, computed as `current_user.id == project.owner_id`.

#### Scenario: Owner sees `is_owner: true`
- **WHEN** the current user is the owner of a project
- **THEN** the project's JSON in `index` and `show` includes `is_owner: true`

#### Scenario: Member sees `is_owner: false`
- **WHEN** the current user is a member of a project but not the owner (role `editor` or `viewer`)
- **THEN** the project's JSON in `index` and `show` includes `is_owner: false`
