## ADDED Requirements

### Requirement: Preview card shows image and name only
The preview card at the top of the form SHALL display only the product thumbnail and product name. The price SHALL NOT be shown in the preview card. The product name SHALL fill the available horizontal space next to the thumbnail.

#### Scenario: Preview card renders
- **WHEN** product data is available (scraped or restored)
- **THEN** the preview card shows the thumbnail image and product name only, with no price element

#### Scenario: Long product name
- **WHEN** the product name is longer than fits on two lines
- **THEN** the name is allowed to wrap to up to three lines, filling the space previously used by the price

### Requirement: Fields always visible
All form fields SHALL be visible without any collapsible sections. There SHALL be no "Więcej opcji" toggle or expandable/collapsible wrapper.

#### Scenario: Form renders
- **WHEN** the extension form is displayed
- **THEN** all fields (name, price, quantity, unit, project, section, notes, dimensions, thumbnail URL, product URL) are visible without clicking any toggle

### Requirement: Field order
The form fields SHALL be displayed in the following order from top to bottom:
1. Preview card (image + name)
2. Nazwa produktu (text input)
3. Cena + price picker button + Ilość + Jednostka (row)
4. Category suggestion pills (auto-detected, when available)
5. Projekt + Sekcja (row of selects)
6. Notatki (textarea)
7. Wymiary (text input)
8. Miniaturka URL (text input)
9. Link do produktu (text input)
10. Dodaj do SAIVED (submit button)

#### Scenario: Notes positioned after project/section
- **WHEN** the form renders
- **THEN** the Notatki textarea appears immediately after the Projekt/Sekcja row and before Wymiary

### Requirement: Price label without currency suffix
The price input label SHALL read "Cena" without any currency indicator. The "(PLN)" suffix SHALL be removed.

#### Scenario: Price label text
- **WHEN** the form renders
- **THEN** the price field label reads "Cena" with no parenthetical currency suffix

### Requirement: No section header
The form SHALL NOT display the "Popraw dane (jeśli błędne)" header text above the form fields.

#### Scenario: Form renders without header
- **WHEN** the extension form is displayed
- **THEN** no instructional header text appears between the preview card and the first input field

### Requirement: Status field removed
The status select field SHALL be removed from the form. The status value SHALL be hardcoded to `"bez_statusu"` in the API submission payload.

#### Scenario: Form does not show status
- **WHEN** the form renders
- **THEN** no status dropdown is visible

#### Scenario: Item submitted
- **WHEN** the user submits an item
- **THEN** the API payload includes `status: "bez_statusu"` regardless of any other state

### Requirement: Discount field removed
The discount code input field SHALL be removed from the form and from the API submission payload.

#### Scenario: Form does not show discount
- **WHEN** the form renders
- **THEN** no discount code input field is visible

#### Scenario: Item submitted without discount
- **WHEN** the user submits an item
- **THEN** the API payload does not include a `discount_label` field

### Requirement: Category select removed
The category dropdown select field SHALL be removed from the form. Category SHALL only be set via the auto-detected category suggestion pills. If no pill is selected, category SHALL be sent as empty.

#### Scenario: Form does not show category dropdown
- **WHEN** the form renders
- **THEN** no category dropdown select is visible

#### Scenario: Category set via pill
- **WHEN** the user clicks a category suggestion pill
- **THEN** the category value is set from the pill and included in the API payload

#### Scenario: No category selected
- **WHEN** the user does not click any category pill
- **THEN** the API payload includes an empty category value
