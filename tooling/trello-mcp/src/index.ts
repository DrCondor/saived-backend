#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TrelloClient } from "./trello-client.js";
import { registerTools } from "./tools.js";

async function main() {
  const key = process.env.TRELLO_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!key || !token || !boardId) {
    console.error("Missing TRELLO_KEY, TRELLO_TOKEN, or TRELLO_BOARD_ID env var.");
    process.exit(1);
  }

  const client = new TrelloClient(key, token, boardId);
  const server = new McpServer({
    name: "saived-trello",
    version: "0.1.0",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server runs until stdio closes.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
