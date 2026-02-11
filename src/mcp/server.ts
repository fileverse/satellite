import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SatelliteClient } from "./client.js";
import { registerTools } from "./tools.js";
import type { SatelliteConfig } from "./types.js";

export function createMcpServer(config: SatelliteConfig): McpServer {
  const client = new SatelliteClient(config);

  const server = new McpServer({
    name: "satellite",
    version: "0.0.13",
  });

  registerTools(server, client);

  return server;
}
