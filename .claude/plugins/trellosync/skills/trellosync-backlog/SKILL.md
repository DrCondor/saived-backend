---
name: trellosync-backlog
description: Use to see what's in "To Do". Returns a markdown table of cards.
---

# Show Backlog

## Protocol

### 1. List cards

Call MCP tool: `trello_list_cards("To Do")`.

### 2. Render as markdown table

```markdown
| ID | Title | Labels |
|---|---|---|
| <card.id[0:8]> | <card.name> | <card.labels.join(", ")> |
| ... |
```

### 3. Hint next step

After the table, append: "Run `/trellosync:start <ID>` on any card."
