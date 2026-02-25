## Why

When filters are applied in the project view (search, status, category, sort), the PDF export still renders all items. Designers need to export PDFs showing only the items they've filtered to — e.g., exporting only "kupione" items for a purchase summary, or only items from a specific category for a focused client presentation.

## What Changes

- Replace the current `<a href>` GET-based PDF link with a POST-based fetch that sends visible item IDs
- Backend accepts optional `item_ids` parameter to scope which items appear in the PDF
- Empty sections (no matching items) are hidden from the PDF
- Item order in PDF respects the frontend sort order (items rendered in the order IDs are passed)
- Section subtotals and grand total reflect only the included items
- When no filters are active, all item IDs are still sent via POST (single code path)

## Capabilities

### New Capabilities
- `filtered-pdf-export`: PDF export scoped to a set of item IDs passed from the frontend, with section-aware rendering and recalculated totals

### Modified Capabilities

(none — no existing spec requirements are changing)

## Impact

- **Backend**: `ProjectsController#pdf` action changes from GET to POST, `ProjectPdfGenerator` accepts optional item ID scoping
- **Frontend**: `ProjectToolbar.tsx` PDF button changes from `<a href>` to a click handler with `fetch()` + blob URL
- **API**: `POST /api/v1/projects/:id/pdf` with `{ item_ids: [...] }` body — **BREAKING** for any direct GET links (unlikely to exist externally)
- **Routes**: `config/routes.rb` changes `get :pdf` to `post :pdf`
- **Tests**: Backend PDF tests need updating for POST + item_ids param; new frontend tests for the fetch+blob flow
