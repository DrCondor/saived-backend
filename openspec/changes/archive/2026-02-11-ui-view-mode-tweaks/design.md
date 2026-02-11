## Context

The workspace SPA has three view modes for project items: grid (default), list (compact), and moodboard. Currently, section and group headers use identical `text-lg font-bold` styling in all views, and the view mode state is local React state that resets to `grid` on every page load.

The codebase already has a localStorage persistence pattern for collapsed sections (`saived_collapsed_sections`) and groups (`saived_collapsed_groups`) that we can follow.

## Goals / Non-Goals

**Goals:**
- Headers feel proportional to items in each view mode
- View mode survives page reloads and navigation
- Minimal code change — conditional Tailwind classes, no new components

**Non-Goals:**
- Per-project view mode persistence (global is sufficient)
- Redesigning the header layout or structure
- Changing item card sizing in any view

## Decisions

### 1. View-mode-aware header sizing via conditional Tailwind classes

Pass `viewMode` to `SectionGroupBlock` (it already reaches `Section`). Apply conditional classes:

| Element | Grid | List | Moodboard |
|---------|------|------|-----------|
| Title | `text-lg font-bold` | `text-sm font-semibold` | `text-base font-medium` |
| Badge | `text-sm font-bold px-4 py-1.5` | `text-xs font-semibold px-2.5 py-0.5` | `text-xs font-semibold px-3 py-1` |
| Chevron | `w-5 h-5` | `w-4 h-4` | `w-4 h-4` |
| Spacing | `mb-3 pb-2` | `mb-1.5 pb-1` | `mb-2 pb-1.5` |

**Rationale**: List view is for dense, efficient work — headers should be compact. Moodboard is visual — headers should recede so images dominate. Grid is the full-featured default.

### 2. Global localStorage persistence for view mode

Key: `saived_view_mode`. Read on `ProjectView` mount, write on change. Follow the existing collapsed-sections pattern (simple get/set helpers).

**Rationale**: Global is simpler and matches the mental model — users pick a work style, not a per-project preference. One localStorage key vs. N.

## Risks / Trade-offs

- [Tight header spacing in list view may look cramped with many sections] → Visually test; `mb-1.5 pb-1` still provides clear separation
- [localStorage can be cleared by browser] → Acceptable; falls back to `grid` default
