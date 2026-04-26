# trellosync plugin

Trello ↔ git/opsx synchronization.

## Skills

- `trellosync:start <CARD_ID>` — pull card, branch, opsx scaffold, move card
- `trellosync:ship` — comment + move card after PR opened
- `trellosync:backlog` — list "To Do" as markdown table
- `trellosync:comment <CARD_ID> <TEXT>` — post comment

## Dependencies

Trello MCP server in `tooling/trello-mcp/`. See `.mcp.json` for config.

## Required env

- `TRELLO_KEY`
- `TRELLO_TOKEN`
- (board ID hard-coded in `.mcp.json`)
