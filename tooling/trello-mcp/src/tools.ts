import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TrelloClient } from "./trello-client.js";

type ToolResult = {
  content: { type: "text"; text: string }[];
  isError?: boolean;
};

function ok(text: string): ToolResult {
  return { content: [{ type: "text", text }] };
}

function err(e: unknown): ToolResult {
  const msg = e instanceof Error ? e.message : String(e);
  return { content: [{ type: "text", text: `Error: ${msg}` }], isError: true };
}

export function registerTools(server: McpServer, client: TrelloClient) {
  server.tool(
    "trello_list_cards",
    "List cards in a Trello list (by list name).",
    { list_name: z.string().describe("Name of the Trello list, e.g. 'To Do'") },
    async ({ list_name }) => {
      try {
        const cards = await client.listCards(list_name);
        const summary = cards.map((c) => ({
          id: c.id,
          name: c.name,
          url: c.url,
          labels: c.labels.map((l) => l.name),
        }));
        return ok(JSON.stringify(summary, null, 2));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "trello_get_card",
    "Get full details of a Trello card including comments.",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      try {
        const card = await client.getCard(card_id);
        return ok(JSON.stringify(card, null, 2));
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "trello_move_card",
    "Move a Trello card to a different list (by list name).",
    {
      card_id: z.string(),
      target_list: z.string().describe("Name of target list, e.g. 'In Progress'"),
    },
    async ({ card_id, target_list }) => {
      try {
        await client.moveCard(card_id, target_list);
        return ok(`moved ${card_id} → ${target_list}`);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "trello_update_card_description",
    "Replace a Trello card's description (overwrites existing). Use for refined specs that should live as the canonical card body, not as a comment.",
    { card_id: z.string(), desc: z.string().describe("New description (markdown supported)") },
    async ({ card_id, desc }) => {
      try {
        await client.updateCardDescription(card_id, desc);
        return ok(`description updated for ${card_id}`);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "trello_comment_card",
    "Post a comment on a Trello card.",
    { card_id: z.string(), text: z.string() },
    async ({ card_id, text }) => {
      try {
        const r = await client.commentCard(card_id, text);
        return ok(`comment ${r.id}`);
      } catch (e) {
        return err(e);
      }
    },
  );

  server.tool(
    "trello_get_board",
    "Summary of the configured board: list names with card counts.",
    {},
    async () => {
      try {
        const s = await client.getBoardSummary();
        return ok(JSON.stringify(s, null, 2));
      } catch (e) {
        return err(e);
      }
    },
  );
}
