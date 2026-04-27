## ADDED Requirements

### Requirement: Sidebar context menu offers project duplication for owners
The sidebar project context menu SHALL display a `"Duplikuj projekt"` entry for projects where the current user is the owner. Non-owners SHALL NOT see this entry.

#### Scenario: Owner sees the entry
- **WHEN** a user right-clicks a sidebar row for a project where `is_owner === true`
- **THEN** the context menu displays a `"Duplikuj projekt"` button positioned between the favorite toggle and the divider that precedes `"Usuń projekt"`

#### Scenario: Non-owner does not see the entry
- **WHEN** a user right-clicks a sidebar row for a project where `is_owner === false`
- **THEN** the context menu does NOT display any duplicate-related button
- **AND** only the favorite toggle and `"Usuń projekt"` entries are shown

### Requirement: Duplicate menu click triggers mutation and navigates
Clicking the `"Duplikuj projekt"` entry SHALL call the duplicate API and, on success, navigate the user to the new project.

#### Scenario: Successful duplication
- **WHEN** the user clicks the `"Duplikuj projekt"` entry
- **THEN** the frontend invokes `useDuplicateProject` with the project's id, which sends `POST /api/v1/projects/:id/duplicate`
- **AND** on success the `['projects']` query is invalidated
- **AND** the user is navigated to `/workspace/projects/${newProject.id}`
- **AND** the context menu closes

#### Scenario: Mutation in flight
- **WHEN** the duplicate request is in flight
- **THEN** the user is not navigated until the response arrives
- **AND** subsequent clicks on the same menu entry do not stack additional duplicates beyond standard React Query mutation deduplication
