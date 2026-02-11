#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { SatelliteClient } from "./client.js";
import { registerTools } from "./tools.js";
import type { SatelliteConfig } from "./types.js";

function loadConfig(): SatelliteConfig {
  // Priority: explicit env vars > ~/.satellite/.env (written by CLI) > ~/.satelliterc > defaults
  const satelliteEnv = tryReadSatelliteEnv();
  const rc = tryReadRc();

  const apiKey =
    process.env.SATELLITE_API_KEY || satelliteEnv?.apiKey || rc?.apiKey;

  const serverUrl =
    process.env.SATELLITE_SERVER_URL || satelliteEnv?.serverUrl || rc?.serverUrl || "http://localhost:8001";

  if (!apiKey) {
    console.error(
      "No API key configured. Run 'npx @fileverse/satellite' first, or set SATELLITE_API_KEY env var.",
    );
    process.exit(1);
  }

  return { serverUrl, apiKey };
}

function tryReadSatelliteEnv(): Partial<SatelliteConfig> | null {
  try {
    const envPath = join(homedir(), ".satellite", ".env");
    if (!existsSync(envPath)) return null;
    const content = readFileSync(envPath, "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) vars[match[1].trim()] = match[2].trim();
    }
    const port = vars.PORT || "8001";
    return {
      apiKey: vars.API_KEY,
      serverUrl: `http://localhost:${port}`,
    };
  } catch {
    return null;
  }
}

function tryReadRc(): Partial<SatelliteConfig> | null {
  try {
    const rcPath = join(homedir(), ".satelliterc");
    if (!existsSync(rcPath)) return null;
    const content = readFileSync(rcPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  const client = new SatelliteClient(config);

  const server = new McpServer({
    name: "satellite",
    version: "0.0.12",
  });

  registerTools(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
