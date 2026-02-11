#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createMcpServer } from "./server.js";
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

function parseEnvFile(filePath: string): Record<string, string> | null {
  try {
    if (!existsSync(filePath)) return null;
    const content = readFileSync(filePath, "utf-8");
    const vars: Record<string, string> = {};
    for (const line of content.split("\n")) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) vars[match[1].trim()] = match[2].trim();
    }
    return vars;
  } catch {
    return null;
  }
}

function tryReadSatelliteEnv(): Partial<SatelliteConfig> | null {
  // Same resolution order as src/config/index.ts: project config/.env first, then ~/.satellite/.env
  const projectEnvPath = join(process.cwd(), "config", ".env");
  const userEnvPath = join(homedir(), ".satellite", ".env");

  const vars = parseEnvFile(projectEnvPath) || parseEnvFile(userEnvPath);
  if (!vars) return null;

  const port = vars.PORT || "8001";
  return {
    apiKey: vars.API_KEY,
    serverUrl: `http://localhost:${port}`,
  };
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
  const server = createMcpServer(config);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP server failed to start:", err);
  process.exit(1);
});
