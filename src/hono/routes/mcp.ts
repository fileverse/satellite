import { Hono } from "hono";
import { createMcpServer } from "../../mcp/server.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppEnv } from "../index.js";

const mcpRoutes = new Hono<AppEnv>();

mcpRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const apiKey = c.env.API_KEY;
  const url = new URL(c.req.url);
  const serverUrl = `${url.protocol}//${url.host}`;

  const server = createMcpServer({ serverUrl, apiKey });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);

  // Create minimal Node.js-compatible request/response objects
  // for StreamableHTTPServerTransport.handleRequest()
  let responseStatus = 200;
  let responseHeaders: Record<string, string> = {};
  let responseBody = "";

  const mockReq = {
    method: "POST",
    headers: Object.fromEntries(c.req.raw.headers.entries()),
    url: url.pathname,
  };

  const mockRes = {
    writeHead(status: number, headers?: Record<string, string | string[]>) {
      responseStatus = status;
      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
        }
      }
      return mockRes;
    },
    setHeader(name: string, value: string) {
      responseHeaders[name] = value;
      return mockRes;
    },
    write(data: string | Buffer) {
      responseBody += typeof data === "string" ? data : data.toString();
      return true;
    },
    end(data?: string | Buffer) {
      if (data) {
        responseBody += typeof data === "string" ? data : data.toString();
      }
    },
    on() { return mockRes; },
  };

  await transport.handleRequest(mockReq as any, mockRes as any, body);

  await transport.close();
  await server.close();

  return new Response(responseBody, {
    status: responseStatus,
    headers: responseHeaders,
  });
});

mcpRoutes.get("/", (c) => {
  return c.json({ error: "Method Not Allowed. Use POST for MCP requests." }, 405);
});

mcpRoutes.delete("/", (c) => {
  return c.json({ error: "Method Not Allowed. No sessions in stateless mode." }, 405);
});

export { mcpRoutes };
