---
name: sdlc-pr
description: Use AFTER sdlc:verification passes, to open a GitHub PR with a context-aware checklist. The checklist adapts to what the diff touched.
---

# SAIVED PR Creation

This skill opens a GitHub PR whose description includes a checklist tailored to the changes.

## Inputs

1. The current branch's diff against `main`: `git diff main...HEAD`
2. The active opsx proposal: `openspec/changes/<id>/proposal.md` (if present)
3. The Trello card ID: parsed from branch name (`feat/<slug>` → look up via trellosync) OR explicitly passed

## Algorithm

1. Run `git diff --name-only main...HEAD` to enumerate changed files.
2. Apply each rule from the conditional table (see "Heuristics" below) — append matching items.
3. Always include the BASE pre-merge and post-merge sections.
4. Compose the PR body and open with `gh pr create`.

## Heuristics

(Filled in Task 4.1 — see updated SKILL.md after Stage 4.)

## Base sections

```markdown
## Trello
Trello-Card: <CARD_ID>

## Spec
<link to openspec/changes/<id>/proposal.md or "n/a">

## Pre-merge (HUMAN MUST TICK)
- [ ] Tests pass locally (`bin/rails test`)
- [ ] Rubocop clean (`bin/rubocop`)
- [ ] Brakeman clean (`bin/brakeman -q`)
- [ ] Spec & implementation match (read both side-by-side)

## Post-merge (HUMAN MUST TICK after deploy)
- [ ] Fly.io deploy green (link to release)
- [ ] Production smoke test passed
- [ ] Logs sane 5 minutes post-deploy
- [ ] Rollback command verified: `fly releases rollback v<N-1>`
```
