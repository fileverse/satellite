#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { createMcpServer } from "./server.js";
import type { FileverseConfig } from "./types.js";

function loadConfig(): FileverseConfig {
  // Priority: explicit env vars > ~/.fileverse/.env (written by CLI) > ~/.fileverseapirc > defaults
  const fileverseEnv = tryReadFileverseEnv();
  const rc = tryReadRc();

  const apiKey =
    process.env.FILEVERSE_API_KEY || fileverseEnv?.apiKey || rc?.apiKey;

  const serverUrl =
    process.env.FILEVERSE_SERVER_URL || fileverseEnv?.serverUrl || rc?.serverUrl || "http://localhost:8001";

  if (!apiKey) {
    console.error(
      "No API key configured. Run 'npx @fileverse/api' first, or set FILEVERSE_API_KEY env var.",
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

function tryReadFileverseEnv(): Partial<FileverseConfig> | null {
  // Same resolution order as src/config/index.ts: project config/.env first, then ~/.fileverse/.env
  const projectEnvPath = join(process.cwd(), "config", ".env");
  const userEnvPath = join(homedir(), ".fileverse", ".env");

  const vars = parseEnvFile(projectEnvPath) || parseEnvFile(userEnvPath);
  if (!vars) return null;

  const port = vars.PORT || "8001";
  return {
    apiKey: vars.API_KEY,
    serverUrl: `http://localhost:${port}`,
  };
}

function tryReadRc(): Partial<FileverseConfig> | null {
  try {
    const rcPath = join(homedir(), ".fileverseapirc");
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
