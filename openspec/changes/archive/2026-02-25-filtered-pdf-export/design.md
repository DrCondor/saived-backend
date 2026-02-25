## Context

Currently, the PDF export is triggered by a simple `<a href="/api/v1/projects/:id/pdf">` link that opens in a new tab. The backend `ProjectsController#pdf` action loads all sections and items for the project and passes them to `ProjectPdfGenerator`, which renders everything.

Filtering (search, status, category) and sorting happen entirely client-side in `ProjectView.tsx` via a `useMemo` hook. The filter state lives in React component state — it is not reflected in the URL or persisted anywhere.

This means the backend has no visibility into what the user is currently seeing. We need to bridge this gap.

## Goals / Non-Goals

**Goals:**
- PDF export renders only the items visible in the current filtered view
- Section subtotals and grand total reflect only included items
- Empty sections (after filtering) are omitted from PDF
- Item order in PDF matches frontend sort order
- Single code path — always POST with item IDs, whether filters are active or not

**Non-Goals:**
- Server-side filtering logic (we pass IDs, not filter params)
- Persisting filter state in URL or localStorage
- Any changes to the filtering UI itself
- PDF design/layout changes beyond item scoping

## Decisions

### 1. POST with item IDs (not filter params)

**Choice**: Frontend sends `{ item_ids: [4, 7, 2, ...] }` via POST.

**Why not filter params?** Duplicating the filtering logic (search substring matching, status/category inclusion, sort order) in Ruby would create a maintenance burden and risk divergence. The frontend already computes exactly which items are visible and in what order — just send that result.

**Why not GET with query params?** Projects can have 200+ items. URL length limits (~2000 chars) could be hit. POST body has no practical size limit.

### 2. Item order determined by ID array order

The `item_ids` array order defines rendering order within each section. The backend groups IDs by their section, preserving the array order within each group. This means frontend sorting (price, name, status) is reflected in the PDF without any sort logic on the backend.

### 3. Security: scope item IDs to project

The backend MUST verify that every item ID in the request belongs to the specified project. This prevents a user from injecting item IDs from other projects into a PDF.

Implementation: load items via `project.sections.flat_map(&:items).where(id: item_ids)` — items not belonging to the project are silently ignored.

### 4. Section rendering: filter then skip empties

For each section in the project:
1. Filter its items to only those in `item_ids`
2. Preserve the order from `item_ids`
3. If no items remain, skip the section entirely
4. Recalculate section subtotal from included items only

Grand total = sum of all rendered section subtotals.

### 5. Frontend: fetch + blob URL pattern

Replace the `<a href>` with a button that:
1. Collects item IDs from `processedSections` (the already-filtered data)
2. POSTs to `/api/v1/projects/:id/pdf` with JSON body
3. Receives PDF blob response
4. Creates a blob URL via `URL.createObjectURL(blob)`
5. Opens it in a new tab via `window.open(blobUrl)`

This keeps the UX identical (PDF opens in new tab) while allowing POST with body.

## Risks / Trade-offs

**[Blob URL browser support]** → All modern browsers support `URL.createObjectURL`. Not a real concern for our target users.

**[CSRF on POST]** → The existing `api/client.ts` fetch wrapper already handles CSRF tokens for session auth. We'll use it.

**[Large item_ids arrays]** → A project with 500 items sends 500 integers in the POST body. This is ~2-4KB of JSON — negligible.

**[No GET fallback]** → Direct URL bookmarks to the PDF endpoint will stop working. This is acceptable — PDFs are generated on demand, not bookmarked.
