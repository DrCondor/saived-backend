---
name: trellosync-ship
description: Use AFTER opening a PR for a feature branch. Posts PR link to Trello card and moves card to "W testach (Marti)".
---

# Ship: Hand Off Card to QA

## Preconditions
- Open PR exists for current branch
- PR body contains `Trello-Card: <card_id>` line

## Protocol

### 1. Read PR

```bash
gh pr view --json number,url,title,body
```

If no PR: halt with "Open a PR first via /sdlc:pr."

### 2. Extract card ID

Regex `Trello-Card:\s*([A-Za-z0-9]+)` against PR body.

If not found: halt with "PR body missing `Trello-Card:` line — fix before shipping."

### 3. Comment on Trello

Call MCP tool: `trello_comment_card(card_id, "🚀 PR ready for QA: <pr.url>")`.

### 4. Move card

Call MCP tool: `trello_move_card(card_id, "W testach (Marti)")`.

### 5. Confirm

State: "Card moved to W testach (Marti). PR <pr.url>."
