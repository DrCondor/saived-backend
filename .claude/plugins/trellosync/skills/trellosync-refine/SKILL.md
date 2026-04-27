---
name: trellosync-refine
description: Use BEFORE trellosync-start when a Trello card is vague. Reads the card, produces a clarified description with acceptance criteria, scope, out-of-scope, open questions, and risks, then posts it back as a Trello comment for human PM review. Does NOT create a branch or scaffold opsx — refinement is a separate, reviewable step.
---

# Refine a Vague Trello Card

Translate a loose ticket into a reviewable spec **on Trello itself**, before any branch or code artefact exists. The PM (or you) reviews the refined version, edits if needed, then runs `trellosync-start` when it's ready for development.

## Inputs
- `<CARD_ID>` — Trello card short ID (e.g. `abc123XY`) OR full URL

The refined spec **replaces the card description** so the card itself becomes the production-ready brief. A short audit comment is also posted noting the agent + timestamp for traceability. The original (vague) description is intentionally not preserved — the card is the spec, not a history of how it got there.

## Protocol

### 1. Pull the card

Call MCP tool: `trello_get_card(card_id)`. If not found, halt with the Trello error verbatim.

Capture: `name`, `desc`, `comments`, `labels`, `url`, current list name.

### 2. Read project context

Read `CLAUDE.md` (always) and the relevant area of the codebase suggested by the card title (read-only — do not edit anything). Goal: understand the existing models, routes, and conventions you'll be specifying against.

### 3. Identify what's clear vs. ambiguous

Internally, list:
- What the card states explicitly
- What it implies but doesn't say
- What it omits (acceptance criteria, scope boundaries, edge cases)
- Where it conflicts with existing code or conventions

If the card is **already well-formed** (has clear acceptance criteria + scope + out-of-scope), halt with: "Card already refined — proceed to `/trellosync-start <card_id>`."

### 4. Produce the refined spec

Markdown structure (this becomes the card description — keep it scannable but complete):

```markdown
## Business context
<2-3 sentences on why this matters and who benefits>

## Acceptance criteria
- [ ] <testable criterion 1>
- [ ] <testable criterion 2>
- [ ] ...

## Scope (in)
- <concrete deliverable>
- ...

## Out of scope (explicitly)
- <what we are NOT doing — name it, don't say "nothing else">
- ...

## Open questions for PM
- <ambiguity that needs human decision before development starts>
- ...

## Technical risks / notes
- <migration? new public route? PII surface? N+1 risk? cross-team impact?>
- ...

## Estimated decomposition
<one of: "single slice", "2 parallel slices: A) backend ..., B) frontend ...", "3+ slices, candidate for /saived:sdlc-parallel">
```

**Hard rules for the refined spec:**
- Acceptance criteria MUST be testable (avoid "works well", prefer "duplicating a project copies all sections and items but resets timestamps")
- Out-of-scope MUST be a list, not "nothing else"
- Open questions are encouraged — better to surface ambiguity than guess
- If you cannot find ≥1 risk, say so explicitly ("No notable risks identified — pure-additive change") rather than inventing one

### 5. Write the refined spec to the card

Call MCP tool: `trello_update_card_description(card_id, <refined_markdown>)`.

Then post a short audit comment so the change is traceable:

```
trello_comment_card(card_id, "🤖 Description refined by architect agent on YYYY-MM-DD. Open questions surfaced — see card body.")
```

If the description update fails: do NOT silently fall back to a comment. Halt with the Trello error and the full markdown printed so the human can paste it into the card manually. Description is the contract; a comment is not an acceptable substitute.

### 6. Halt — hand back to human

State exactly:

> "Refined spec posted to Trello card `<card_id>`. Open questions for you to resolve: `<list>`. When the card is ready for development, run `/trellosync-start <card_id>`."

**Do NOT:**
- Create a git branch
- Scaffold opsx
- Move the card to "In Progress"
- Invoke any other agent

Refinement is a **standalone reviewable step**. The next move belongs to the human.

## Failure modes

| Failure | Action |
|---|---|
| Card not found | halt, surface Trello error |
| Card already well-formed | halt with "already refined" message (see step 3) |
| MCP description update fails | retry once, then halt with full markdown printed for manual paste — do NOT post as comment instead |
| MCP audit comment fails | description update succeeded → continue, just note the audit comment failed |
| Card has 5+ open questions | halt with "Card too vague for automated refinement — needs human PM input first" |
| Codebase context contradicts card intent | flag in "Open questions for PM" section, do NOT silently override |

## Why this skill exists

Vague tickets cause downstream waste: the architect commits to a proposal based on a hallucinated reading of intent, the implementer writes code against the wrong target, the reviewer can only catch deviations from the *spec* (not from what the PM actually meant).

Catching ambiguity at the Trello level — before any branch or proposal artefact exists — keeps the cost of clarification cheap (one round-trip on a card) instead of expensive (rebase, re-spec, re-implement).
