## ADDED Requirements

### Requirement: PDF export accepts item IDs via POST
The system SHALL accept a POST request to `/api/v1/projects/:id/pdf` with a JSON body containing an `item_ids` array of integer project item IDs. The response SHALL be an inline PDF containing only the specified items.

#### Scenario: POST with item IDs returns filtered PDF
- **WHEN** user sends POST `/api/v1/projects/:id/pdf` with `{ "item_ids": [1, 3, 5] }`
- **THEN** the returned PDF SHALL contain only items with IDs 1, 3, and 5

#### Scenario: POST with empty item IDs returns PDF with no items
- **WHEN** user sends POST `/api/v1/projects/:id/pdf` with `{ "item_ids": [] }`
- **THEN** the returned PDF SHALL render with no item rows and a zero grand total

#### Scenario: POST without item_ids renders all items
- **WHEN** user sends POST `/api/v1/projects/:id/pdf` with no `item_ids` parameter
- **THEN** the returned PDF SHALL contain all items in the project (backward-compatible behavior)

### Requirement: Item IDs are scoped to the requested project
The system SHALL only include items that belong to the specified project, regardless of what IDs are passed. Item IDs belonging to other projects SHALL be silently ignored.

#### Scenario: Foreign item IDs are ignored
- **WHEN** user sends POST with `item_ids` containing IDs from another project
- **THEN** those foreign IDs SHALL be excluded from the PDF without error

#### Scenario: Mix of valid and invalid IDs
- **WHEN** user sends POST with `item_ids: [1, 999999, 3]` where 999999 does not exist
- **THEN** the PDF SHALL contain only items 1 and 3

### Requirement: Empty sections are omitted from filtered PDF
When item filtering results in a section having zero items, that section SHALL NOT appear in the PDF (no header, no subtotal, no "Brak pozycji" message).

#### Scenario: Section with no matching items is hidden
- **WHEN** a project has sections A (items 1, 2) and B (items 3, 4), and `item_ids: [1, 2]` is sent
- **THEN** only section A SHALL appear in the PDF; section B SHALL be completely omitted

### Requirement: Item order in PDF matches the order of item_ids
Items within each section SHALL be rendered in the order their IDs appear in the `item_ids` array, not the default database position order. This allows the frontend sort order to be reflected in the PDF.

#### Scenario: Custom sort order is preserved
- **WHEN** section has items [id:1 pos:1, id:2 pos:2, id:3 pos:3] and `item_ids: [3, 1, 2]` is sent
- **THEN** the PDF SHALL render items in order: 3, 1, 2 within that section

### Requirement: Totals reflect only included items
Section subtotals and the grand total SHALL be calculated from only the items included via `item_ids`. The `include_in_sum?` logic (proposal items excluded from sum) SHALL still apply to the filtered set.

#### Scenario: Filtered subtotal
- **WHEN** section has items A (100 zl), B (200 zl), C (300 zl) and only A and C are in `item_ids`
- **THEN** the section subtotal SHALL be 400 zl

#### Scenario: Grand total reflects filtered items only
- **WHEN** project has 10 items totaling 5000 zl but only 3 items totaling 1200 zl are in `item_ids`
- **THEN** the grand total SHALL be 1200 zl

#### Scenario: Proposal items still excluded from sum in filtered view
- **WHEN** `item_ids` includes a "propozycja" status item
- **THEN** that item SHALL appear in the PDF but SHALL NOT be included in subtotals or grand total

### Requirement: Frontend sends visible item IDs when generating PDF
The frontend PDF button SHALL collect item IDs from the currently displayed (filtered, sorted) sections and POST them to the PDF endpoint. The PDF button SHALL always use POST, regardless of whether filters are active.

#### Scenario: PDF with active filters
- **WHEN** user has status filter "kupione" active showing 5 of 20 items, and clicks "Podglad PDF"
- **THEN** the frontend SHALL POST only the 5 visible item IDs

#### Scenario: PDF without filters
- **WHEN** no filters are active and user clicks "Podglad PDF"
- **THEN** the frontend SHALL POST all item IDs from all sections

### Requirement: Authentication on POST endpoint
The POST PDF endpoint SHALL require authentication (session or Bearer token), matching the existing authentication requirements of the GET endpoint it replaces.

#### Scenario: Unauthenticated POST returns 401
- **WHEN** an unauthenticated request is sent to POST `/api/v1/projects/:id/pdf`
- **THEN** the response SHALL be 401 Unauthorized
