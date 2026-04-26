---
name: trellosync-comment
description: Use to post a comment on a Trello card. Used by other agents (e.g. architect when card is ambiguous).
---

# Post Comment on Card

## Inputs
- `<CARD_ID>`
- `<TEXT>` — markdown allowed

## Protocol

Call MCP tool: `trello_comment_card(card_id, text)`.

Confirm with the comment ID returned.
