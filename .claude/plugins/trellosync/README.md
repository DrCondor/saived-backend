# trellosync plugin

Trello ↔ git/opsx synchronization.

## Skills

- `trellosync:backlog` — list "To Do" as markdown table
- `trellosync:refine <CARD_ID>` — read a vague card, post a clarified spec (acceptance criteria, scope, out-of-scope, open questions, risks) back as a comment for PM review. Halts before any branch/code.
- `trellosync:start <CARD_ID>` — pull card, create branch, scaffold opsx, move card to "In Progress"
- `trellosync:ship` — comment + move card to "W testach (Marti)" after PR opened
- `trellosync:comment <CARD_ID> <TEXT>` — utility: post comment

Typical flow: `backlog` → `refine` → human reviews on Trello → `start` → architect/implementer/reviewer → `ship`.

## Dependencies

Trello MCP server in `tooling/trello-mcp/`. See `.mcp.json` for config.

## Required env

- `TRELLO_KEY`
- `TRELLO_TOKEN`
- (board ID hard-coded in `.mcp.json`)
