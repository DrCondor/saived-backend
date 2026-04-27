# Tasks: project-duplication

**Branch:** `feat/project-duplication`
**Status:** In Progress

## Task List

### Backend

- [x] T1: Add `post :duplicate, on: :member` to `resources :projects` in `config/routes.rb`
- [x] T2: Guard `Project#create_default_section` with thread-local flag
- [x] T3: Create `app/services/projects/` directory and `duplicator.rb` service object
- [x] T4: Add `#duplicate` action to `Api::V1::ProjectsController`
- [x] T5: Add `is_owner:` field to `index` JSON (projects list)
- [x] T6: Add `is_owner:` field to `project_json` (show/create/update/duplicate JSON)

### Frontend

- [x] T7: Add `is_owner: boolean` to `ProjectListItem` and `Project` TypeScript interfaces
- [x] T8: Add `duplicateProject(id)` API helper in `api/projects.ts`
- [x] T9: Add `useDuplicateProject` hook in `hooks/useProjects.ts`
- [x] T10: Add "Duplikuj projekt" context menu entry in `Sidebar.tsx` (gated on `is_owner`)

### Tests (written FIRST — TDD)

- [x] TEST-A: `test/services/projects/duplicator_test.rb` — service unit tests (all scenarios)
- [x] TEST-B: `test/controllers/api/v1/projects_controller_test.rb` — duplicate + is_owner tests
- [x] TEST-C: `app/javascript/workspace/components/Layout/Sidebar.test.tsx` — sidebar menu tests

## Test Scenarios per Suite

### TEST-A: Duplicator service
1. happy path copies project name with " (kopia)" suffix
2. copies description, favorite=false, position=nil
3. creates owner membership only
4. copies active sections verbatim (name, position)
5. copies active section groups verbatim (name, position)
6. remaps section_group_id to new group ids
7. sections with nil section_group_id remain nil
8. copies active items with all 19 whitelisted attributes
9. negative contractor position preserved verbatim
10. soft-deleted sections excluded
11. soft-deleted items excluded
12. ProductCaptureSample not copied
13. ItemFavorite not copied
14. default section NOT created (no "Nowa sekcja" stray section)
15. thread flag cleared after call (even on raise)
16. atomicity: forced raise after first item → zero rows

### TEST-B: Controller
1. 201 + project JSON for owner
2. 401 without auth
3. 403 for editor member
4. 403 for viewer member
5. 404 for foreign project (no membership)
6. 404 for non-existent id
7. index includes is_owner: true for owned project
8. index includes is_owner: false for member-only project

### TEST-C: Sidebar
1. "Duplikuj projekt" visible when is_owner === true
2. "Duplikuj projekt" NOT visible when is_owner === false
3. click triggers useDuplicateProject mutation with correct id
4. on success navigate to /workspace/projects/:new_id
