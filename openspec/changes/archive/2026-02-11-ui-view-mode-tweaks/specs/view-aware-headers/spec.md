## ADDED Requirements

### Requirement: Section headers scale with view mode
Section headers (title, total badge, collapse chevron, spacing) SHALL use view-mode-appropriate sizing. Grid view stays unchanged. List view SHALL use compact sizing. Moodboard SHALL use medium sizing that recedes behind images.

#### Scenario: List view section header
- **WHEN** view mode is `list`
- **THEN** section title SHALL use `text-sm font-semibold`, badge SHALL use `text-xs font-semibold px-2.5 py-0.5`, chevron SHALL use `w-4 h-4`, spacing SHALL use `mb-1.5 pb-1`

#### Scenario: Moodboard view section header
- **WHEN** view mode is `moodboard`
- **THEN** section title SHALL use `text-base font-medium`, badge SHALL use `text-xs font-semibold px-3 py-1`, chevron SHALL use `w-4 h-4`, spacing SHALL use `mb-2 pb-1.5`

#### Scenario: Grid view section header unchanged
- **WHEN** view mode is `grid`
- **THEN** section header styling SHALL remain `text-lg font-bold`, badge `text-sm font-bold px-4 py-1.5`, chevron `w-5 h-5`, spacing `mb-3 pb-2`

### Requirement: Group headers scale with view mode
Group headers SHALL follow the same scaling rules as section headers, preserving the existing `uppercase tracking-wide` treatment across all view modes.

#### Scenario: List view group header
- **WHEN** view mode is `list`
- **THEN** group title SHALL use `text-sm font-semibold uppercase tracking-wide`, badge SHALL use `text-xs font-semibold px-2.5 py-0.5`, chevron SHALL use `w-4 h-4`, spacing SHALL use `mb-1.5 pb-1`

#### Scenario: Grid view group header unchanged
- **WHEN** view mode is `grid`
- **THEN** group header styling SHALL remain unchanged
