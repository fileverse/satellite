import { Router } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";
import type { SatelliteConfig } from "./types.js";

export function createMcpRouter(config: SatelliteConfig): Router {
  const router = Router();

  router.post("/", async (req, res) => {
    const server = createMcpServer(config);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await server.connect(transport);

    await transport.handleRequest(req, res, req.body);

    // Close transport after response to free resources
    await transport.close();
    await server.close();
  });

  // No SSE or sessions in stateless mode
  router.get("/", (_req, res) => {
    res.status(405).json({ error: "Method Not Allowed. Use POST for MCP requests." });
  });

  router.delete("/", (_req, res) => {
    res.status(405).json({ error: "Method Not Allowed. No sessions in stateless mode." });
  });

  return router;
}
