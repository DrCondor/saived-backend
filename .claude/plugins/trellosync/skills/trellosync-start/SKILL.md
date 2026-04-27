---
name: trellosync-start
description: Use when starting work on a Trello card. Pulls card, creates branch, scaffolds opsx change, moves card to In Progress.
---

# Start Work on a Trello Card

## Inputs
- `<CARD_ID>` — Trello card short ID (e.g. `abc123XY`) OR full URL

## Protocol

### 1. Validate card exists

Call MCP tool: `trello_get_card(card_id)`. If not found, halt with the Trello error verbatim.

### 1a. Refinement gate (MANDATORY)

A card is **not ready to start** unless it has been refined. Check `card.desc`:

- If `card.desc` is empty, whitespace-only, or shorter than 200 characters, **HALT immediately** before any branch/scaffold work.
- If `card.desc` is missing the marker `## Acceptance criteria` (case-insensitive), **HALT immediately**.

On halt, output verbatim:

> Card has no refined description (or it's too thin / missing acceptance criteria).
> Run `/trellosync:refine <CARD_ID>` first so PM can review the clarified scope on Trello, then re-run `/trellosync:start <CARD_ID>`.

Do **not** create a branch, do **not** scaffold opsx, do **not** move the card. The user may explicitly override with "skip refinement" — only then proceed.

### 2. Derive a slug

From the card name, lowercase, kebab-case, max 40 chars, alphanumeric + `-`.

Example: "Dashboard total project value" → `dashboard-total-project-value`.

### 3. Verify branch state

```bash
git status --short
```

If working tree is dirty, halt with: "Working tree dirty — commit or stash first."

```bash
git fetch origin
git checkout main
git pull --ff-only
```

### 4. Create the feature branch

```bash
git checkout -b feat/<slug>
```

If branch already exists, ask the user before overwriting.

### 5. Scaffold the opsx change

Run `/opsx:new` with the card name as the change name. The opsx skill creates `openspec/changes/<id>/`.

Then write the card description into `openspec/changes/<id>/source-trello.md`:

```markdown
# Trello source

**Card:** <card_id>
**Title:** <card.name>
**URL:** <card.url>
**List:** <card.idList → resolved to name>

## Description

<card.desc>

## Comments

<for each comment in card.comments:>
**<author>** (<date>):
<text>

---
```

### 6. Move card to "In Progress"

Call MCP tool: `trello_move_card(card_id, "In Progress")`.

### 7. Comment back on card

Call MCP tool: `trello_comment_card(card_id, "🤖 Started on branch `feat/<slug>`")`.

### 8. Hand off to architect

State: "Card pulled. Branch `feat/<slug>` created. opsx scaffold at `openspec/changes/<id>/`. Hand off to **architect** subagent for /opsx:explore + /opsx:propose."

## Failure modes

| Failure | Action |
|---|---|
| Card not found | halt, surface error |
| Branch dirty | halt, ask human |
| Branch already exists | ask before reuse |
| MCP tool error | retry once, then halt |
| Trello rate limit | client handles with backoff; if still failing, halt |
