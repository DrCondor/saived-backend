# saived-trello-mcp

A minimal MCP server exposing Trello board operations.

## Tools

| Tool | Purpose |
|---|---|
| `trello_list_cards` | list cards in a list (by name) |
| `trello_get_card` | full card with comments |
| `trello_move_card` | move card to a different list |
| `trello_comment_card` | post comment |
| `trello_get_board` | summary (lists + counts) |

## Build

```bash
npm install
npm run build
```

Binary lands at `dist/index.js`. Wired into Claude Code via top-level `.mcp.json`.

## Env vars

- `TRELLO_KEY` (required)
- `TRELLO_TOKEN` (required)
- `TRELLO_BOARD_ID` (required; SAIVED's is `6963562a6d9c4475295fc205`)

Sourced from `~/.trello_credentials` in your shell rc.

## Auth

Uses Trello's `key + token` query-string auth. Token must have read+write on the board.
