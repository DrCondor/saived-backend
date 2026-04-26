import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { TrelloClient } from "./trello-client.js";

export function registerTools(server: McpServer, client: TrelloClient) {
  server.tool(
    "trello_list_cards",
    "List cards in a Trello list (by list name).",
    { list_name: z.string().describe("Name of the Trello list, e.g. 'To Do'") },
    async ({ list_name }) => {
      const cards = await client.listCards(list_name);
      const summary = cards.map((c) => ({
        id: c.id,
        name: c.name,
        url: c.url,
        labels: c.labels.map((l) => l.name),
      }));
      return {
        content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      };
    },
  );

  server.tool(
    "trello_get_card",
    "Get full details of a Trello card including comments.",
    { card_id: z.string().describe("Trello card ID") },
    async ({ card_id }) => {
      const card = await client.getCard(card_id);
      return {
        content: [{ type: "text", text: JSON.stringify(card, null, 2) }],
      };
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
      await client.moveCard(card_id, target_list);
      return { content: [{ type: "text", text: `moved ${card_id} → ${target_list}` }] };
    },
  );

  server.tool(
    "trello_comment_card",
    "Post a comment on a Trello card.",
    { card_id: z.string(), text: z.string() },
    async ({ card_id, text }) => {
      const r = await client.commentCard(card_id, text);
      return { content: [{ type: "text", text: `comment ${r.id}` }] };
    },
  );

  server.tool(
    "trello_get_board",
    "Summary of the configured board: list names with card counts.",
    {},
    async () => {
      const s = await client.getBoardSummary();
      return { content: [{ type: "text", text: JSON.stringify(s, null, 2) }] };
    },
  );
}
