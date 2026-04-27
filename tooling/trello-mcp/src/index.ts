#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { TrelloClient } from "./trello-client.js";
import { registerTools } from "./tools.js";

function loadCredsFile(): Record<string, string> {
  // Fallback for when MCP host doesn't propagate shell env (common when CC
  // was launched from a UI / a shell that didn't `source ~/.trello_credentials`).
  // File format: lines like `export FOO=bar` or `FOO=bar`. Quotes stripped.
  try {
    const path = join(homedir(), ".trello_credentials");
    const text = readFileSync(path, "utf8");
    const out: Record<string, string> = {};
    for (const raw of text.split("\n")) {
      const line = raw.trim().replace(/^export\s+/, "");
      const eq = line.indexOf("=");
      if (eq <= 0 || line.startsWith("#")) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
    return out;
  } catch {
    return {};
  }
}

// Some MCP hosts (e.g. Claude Code today) pass `.mcp.json` env values through
// literally without expanding `${VAR}` syntax. Treat unresolved placeholders
// as absent so the file-based fallback can take over.
function envOrNull(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  if (/^\$\{[^}]+\}$/.test(v)) return null;
  return v;
}

async function main() {
  const fileCreds = loadCredsFile();
  const key = envOrNull("TRELLO_KEY") || fileCreds.TRELLO_KEY;
  const token = envOrNull("TRELLO_TOKEN") || fileCreds.TRELLO_TOKEN;
  const boardId =
    envOrNull("TRELLO_BOARD_ID") ||
    fileCreds.TRELLO_BOARD_ID ||
    "6963562a6d9c4475295fc205";

  if (!key || !token || !boardId) {
    console.error("Missing TRELLO_KEY, TRELLO_TOKEN, or TRELLO_BOARD_ID (env or ~/.trello_credentials).");
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
