## 1. Backend Route & Controller

- [x] 1.1 Change `config/routes.rb`: replace `get :pdf` with `post :pdf` on the projects resource
- [x] 1.2 Update `ProjectsController#pdf` to accept `item_ids` param from POST body and pass it to the generator
- [x] 1.3 Add strong parameter permit for `item_ids` (array of integers)

## 2. PDF Generator

- [x] 2.1 Update `ProjectPdfGenerator#initialize` to accept optional `item_ids` keyword argument
- [x] 2.2 Update `render_sections` to filter items per section to only those in `item_ids` (preserving array order), and skip sections with zero matching items
- [x] 2.3 Update `render_section_subtotal` to calculate subtotal from the filtered items passed to it (not `section.total_price`)
- [x] 2.4 Update `render_grand_total` to sum filtered section subtotals (not `@project.total_price`)
- [x] 2.5 Update `has_proposals?` to check only filtered items

## 3. Frontend PDF Button

- [x] 3.1 Add `downloadPdf` function to `api/projects.ts` that POSTs to `/api/v1/projects/:id/pdf` with `{ item_ids }` and returns a blob
- [x] 3.2 Replace `<a href>` in `ProjectToolbar.tsx` with a button that calls `downloadPdf`, creates a blob URL, and opens it in a new tab
- [x] 3.3 Pass `processedSections` (or extracted item IDs) from `ProjectView.tsx` down to `ProjectToolbar` as a prop
- [x] 3.4 Add loading state to the PDF button while the POST request is in flight

## 4. Backend Tests

- [x] 4.1 Update existing PDF controller tests to use POST instead of GET
- [x] 4.2 Add test: POST with `item_ids` returns PDF containing only those items
- [x] 4.3 Add test: POST with foreign item IDs (from another project) are ignored
- [x] 4.4 Add test: POST without `item_ids` returns all items (backward compatibility)
- [x] 4.5 Add test: empty `item_ids` array returns PDF with zero grand total
- [x] 4.6 Update `ProjectPdfGenerator` unit tests for filtered item rendering

## 5. Frontend Tests

- [x] 5.1 Add test: PDF button collects item IDs from processedSections and calls downloadPdf
- [x] 5.2 Add test: PDF button shows loading state during request
