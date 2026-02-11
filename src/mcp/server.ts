import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FileverseClient } from "./client.js";
import { registerTools } from "./tools.js";
import type { FileverseConfig } from "./types.js";

export function createMcpServer(config: FileverseConfig): McpServer {
  const client = new FileverseClient(config);

  const server = new McpServer({
    name: "fileverse-api-mcp",
    version: "0.0.13",
  });

  registerTools(server, client);

  return server;
}
