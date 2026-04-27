## 1. Backend — model & callback skipping

- [ ] 1.1 In `app/models/project.rb`, make `create_default_section` skippable during duplication (e.g. `attr_accessor :skip_default_section` consulted by the callback, or `Project.skip_callback`-around-block in the service). Document the chosen mechanism with a one-line comment.
- [ ] 1.2 Confirm `ProjectMembership` validations are compatible with the duplicate path (owner gets a fresh `role: "owner"` membership on creation).

## 2. Backend — `ProjectDuplicator` service

- [ ] 2.1 Create `app/services/project_duplicator.rb` with `ProjectDuplicator.new(source_project, user).call` returning the new `Project`.
- [ ] 2.2 Wrap the entire copy in a single `ActiveRecord::Base.transaction` so any failure rolls back everything.
- [ ] 2.3 Build the new `Project` with: `name = "Kopia: #{source.name}"`, `owner: user`, `favorite: false`, `description: source.description` (and any other safe fields). Suppress `create_default_section` callback for this save.
- [ ] 2.4 Create a `ProjectMembership(project: new_project, user: user, role: "owner")`.
- [ ] 2.5 Deep-copy `section_groups` first (preserve `name`, `position`); build a map `{old_group_id => new_group}`.
- [ ] 2.6 Deep-copy each `section` (`ProjectSection`), preserving `name`, `position`, and remapped `section_group_id`. Build `{old_section_id => new_section}` map.
- [ ] 2.7 For each source `project_item`, build a new item under the corresponding new section, copying ALL of: `name`, `note`, `quantity`, `unit_type`, `unit_price_cents`, `currency`, `category`, `dimensions`, `status`, `external_url`, `thumbnail_url`, `discount_label`, `discount_percent`, `discount_code`, `original_unit_price_cents`, `item_type`, `address`, `phone`, `position`. Do NOT copy `deleted_at`, `id`, `created_at`, `updated_at`. Bypass `before_create :set_position` by passing `position` explicitly (it is already non-nil).
- [ ] 2.8 If the source item has `attachment.attached?`, attach a fresh blob to the copy using `StringIO.new(source_item.attachment.download)`, mirroring the pattern used in `Api::V1::ProjectItemsController#duplicate`. Test that this produces an independent blob.
- [ ] 2.9 Do NOT touch `ProductCaptureSample` (associations are skipped; new project has none).
- [ ] 2.10 Do NOT copy `ItemFavorite` rows.
- [ ] 2.11 Do NOT copy any `ProjectMembership` rows from the source (only the new owner membership exists).
- [ ] 2.12 Return the persisted new `Project`, eager-loaded as needed for the controller's JSON response (`includes(:section_groups, sections: { items: { attachment_attachment: :blob } })`).

## 3. Backend — route & controller

- [ ] 3.1 In `config/routes.rb`, add `post :duplicate, on: :member` inside the `resources :projects` block.
- [ ] 3.2 Add `Api::V1::ProjectsController#duplicate`:
  - Resolve the source project via `current_user.projects.find(params[:id])` so non-members get `404`.
  - Authorize: if `source.owner_id != current_user.id`, render `403` `{ error: "Forbidden" }`.
  - Call `ProjectDuplicator.new(source, current_user).call`.
  - Render `project_json(new_project)` with status `:created`.
  - Rescue `ActiveRecord::RecordNotFound -> 404`, `ActiveRecord::RecordInvalid -> 422`.

## 4. Backend — ownership signal in API responses

- [ ] 4.1 Add `is_owner: project.owner_id == current_user.id` (or equivalent) to the `index` and `show` JSON responses in `Api::V1::ProjectsController`. Pure additive.
- [ ] 4.2 Confirm extension code doesn't break on the new field (it ignores unknown fields by design).

## 5. Backend tests

- [ ] 5.1 `test/services/project_duplicator_test.rb`: success path — section_groups / sections / items counts match source, positions preserved, names match, all listed item fields copied verbatim.
- [ ] 5.2 `project_duplicator_test`: ActiveStorage attachment is independent — duplicate the project, destroy the source, then assert the duplicate's attachment still downloads correctly.
- [ ] 5.3 `project_duplicator_test`: `favorite` is forced to `false` even when source has `favorite: true`.
- [ ] 5.4 `project_duplicator_test`: no `ProductCaptureSample`, `ItemFavorite`, or non-owner `ProjectMembership` rows are created on the copy.
- [ ] 5.5 `project_duplicator_test`: `create_default_section` is suppressed — section count equals source's section count, no extra "Nowa sekcja" prepended.
- [ ] 5.6 `project_duplicator_test`: transaction rollback — force a failure mid-copy (e.g. stub one of the child saves to raise), assert no new `Project`, `ProjectSection`, `ProjectItem`, or `ProjectMembership` rows were inserted.
- [ ] 5.7 `test/controllers/api/v1/projects_controller_test.rb`: `POST /duplicate` returns `201` for owner with the expected JSON shape (`id`, `name == "Kopia: ..."`, `is_owner: true`, sections).
- [ ] 5.8 Controller test: returns `401` without auth headers/session.
- [ ] 5.9 Controller test: returns `403` when called by an editor/viewer member of the project (not the owner).
- [ ] 5.10 Controller test: returns `404` when the project doesn't exist or isn't visible to `current_user`.
- [ ] 5.11 Controller test: when called twice in a row, two distinct duplicates are created with names `"Kopia: <original>"` (no uniqueness conflict — names aren't unique).

## 6. Frontend — types & API client

- [ ] 6.1 In `app/javascript/workspace/types/index.ts`, add `is_owner: boolean` to `ProjectListItem` and `Project`.
- [ ] 6.2 In `app/javascript/workspace/api/projects.ts`, add `duplicateProject(id: number): Promise<Project>` calling `POST /projects/:id/duplicate`.

## 7. Frontend — mutation hook

- [ ] 7.1 In `app/javascript/workspace/hooks/useProjects.ts`, add `useDuplicateProject` (TanStack Query mutation) that:
  - Calls `duplicateProject(id)`.
  - On success: invalidates the `['projects']` query so the sidebar refreshes; also seeds the `['project', newProject.id]` cache with the response.
  - Returns the new project so the caller can navigate.

## 8. Frontend — Sidebar context menu

- [ ] 8.1 In `components/Layout/Sidebar.tsx`, add a `handleDuplicateProject` callback that calls `useDuplicateProject` and on success `navigate(/workspace/projects/${newProject.id})`.
- [ ] 8.2 Render a new menu entry "Duplikuj" inside the existing context menu, ABOVE "Usuń projekt".
- [ ] 8.3 Show the entry only when the current user owns the active context-menu project — derived from the `is_owner` flag on `ProjectListItem`. Hide entirely for non-owners (do not render disabled).
- [ ] 8.4 Close the context menu after the click handler fires (mirror the existing `handleDeleteProject` pattern).
- [ ] 8.5 Ensure the existing escape / outside-click dismissal already covers the new entry (it does — the menu is one element).

## 9. Frontend tests

- [ ] 9.1 In `components/Layout/Sidebar.test.tsx` (create if absent), test: right-clicking an owned project opens the context menu and renders "Duplikuj".
- [ ] 9.2 Test: right-clicking a non-owned project (`is_owner: false`) opens the context menu but does NOT render "Duplikuj".
- [ ] 9.3 Test: clicking "Duplikuj" calls the mutation and triggers navigation to the new project's URL (mock `useNavigate` and the API).

## 10. Manual smoke + verification

- [ ] 10.1 `make test` passes.
- [ ] 10.2 `yarn test:run` passes.
- [ ] 10.3 Manual: create a project with at least one section group, multiple sections, products / contractors / notes, and at least one item with an attachment. Right-click in sidebar → "Duplikuj". Confirm: new project appears with `Kopia: ...` prefix, all sections / items present, attachment downloadable, source unchanged.
