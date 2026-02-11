## Context

The workspace grid view uses `@hello-pangea/dnd` for item drag-and-drop between sections. When a section is collapsed, its header becomes a `Droppable` so users can still drop items into it.

**Root cause**: `@hello-pangea/dnd` uses the CENTER of the dragged element for droppable detection, not the cursor position. In grid view, item cards are ~200px tall, so the drag center is ~100px from the cursor. Collapsed section headers (~50px) are too small — the drag center skips over them entirely.

**Failed approaches**:
1. *Invisible padding (`pb-20 -mb-20`)*: Adjacent sections' zones overlapped, wrong section activated.
2. *Header expansion (`py-4`)*: Headers still too small for center-based detection. Direction reversal didn't work.
3. *Visible drop zone placeholder*: Page jumps on drag start, DOM changes during drag unreliable with library. Still didn't fix detection.

**Conclusion**: CSS-based approaches cannot fix a library-level detection algorithm. We need to override the detection itself.

## Goals / Non-Goals

**Goals:**
- Make collapsed section drop targeting use cursor position (not drag-center)
- Support direction reversal (drag past section B, then back to section B)
- Provide accurate visual feedback on collapsed headers based on cursor position
- No layout shifts or page jumps during drag

**Non-Goals:**
- Changing expanded section behavior (works fine with library detection)
- Modifying section reordering (SECTIONS type — unrelated)
- Changing where dropped items are inserted (append-to-end logic stays)
- Switching DnD libraries (cursor override is less risky)

## Decisions

### 1. Cursor-based override for collapsed section detection

**Decision**: Track actual cursor position during item drag via a `mousemove` listener. On each mouse move, check cursor against collapsed section header bounding rects to determine which (if any) collapsed section the cursor is over. Use this for:
- **Visual feedback**: Pass `cursorOverCollapsedSectionId` to Section components. Section uses this prop (not the library's `snapshot.isDraggingOver`) for collapsed header highlighting.
- **Drop targeting**: In `handleDragEnd`, if cursor is over a collapsed section, override the library's `destination` with the cursor-detected section.

**Rationale**: This fixes the detection at the right level — we bypass the library's center-based algorithm only where it fails (collapsed sections) and let it work normally everywhere else (expanded sections, reordering).

**Alternatives considered**:
- *Switch to dnd-kit*: Has `pointerWithin` collision strategy that solves this natively. But the project already migrated away from dnd-kit, and a full DnD rewrite is higher risk.
- *Custom collision detection sensor*: `@hello-pangea/dnd` doesn't expose a collision detection plugin API like dnd-kit does.

### 2. Keep collapsed sections as Droppables but ignore library detection for them

**Decision**: Collapsed sections still render `<Droppable>` wrappers (the library needs valid droppable IDs for the result object). But we ignore `snapshot.isDraggingOver` for collapsed sections and use our cursor-based state instead.

### 3. Remove all previous CSS hacks

**Decision**: Revert all padding/margin tricks and drop zone placeholders. The collapsed droppable wrapper is minimal. No visual changes to the page during drag except header highlighting.

## Risks / Trade-offs

- **Mousemove listener during drag** → Only active during ITEMS drag, removed on drag end. Negligible performance impact.
- **State updates during drag** (for visual feedback) → Only fires when detected section CHANGES, not on every mousemove. Minimal re-renders.
- **Scroll during drag** → `getBoundingClientRect()` returns viewport-relative positions, so scroll is automatically accounted for.
