#!/usr/bin/env node
import "../check-node-version.js";
import { Command } from "commander";
import { fetchApiKeyData } from "./fetch-api-key.js";
import type { AppKeyMaterial, KeyMaterial } from "../types";
import { scaffoldConfig } from "./scaffold-config.js";
import { startAll, setupShutdownHandlers, waitForProcesses } from "./process-manager.js";
import { promptForConfig, needsPrompting } from "./prompts.js";
import { loadConfig } from "../config/index.js";
import { decryptSavedData, initializeWithData } from "../init/index.js";

const program = new Command()
  .name("fileverse-api")
  .description("Run the Fileverse API server")
  .version("1.0.10")
  .option("--apiKey <key>", "API key for authentication")
  .option("--rpcUrl <url>", "RPC URL for blockchain connection")
  .option("--port <port>", "Port to run the server on", "8001")
  .option("--db <path>", "Database path")
  .action(async (options) => {
    try {
      console.log("Fileverse API - Starting initialization...\n");

      if (needsPrompting(options)) {
        const prompted = await promptForConfig({
          apiKey: options.apiKey,
          rpcUrl: options.rpcUrl,
        });
        options.apiKey = prompted.apiKey;
        options.rpcUrl = prompted.rpcUrl;
      }

      const data = await fetchApiKeyData(options.apiKey);
      console.log("✓ API key data retrieved\n");

      const keyMaterial = await decryptSavedData<KeyMaterial>(options.apiKey, data.encryptedKeyMaterial);
      const appMaterial = await decryptSavedData<AppKeyMaterial>(options.apiKey, data.encryptedAppMaterial);
      console.log("Setting up configuration...");
      const envPath = scaffoldConfig({
        dbPath: options.db,
        port: options.port,
        apiKey: options.apiKey,
        rpcUrl: options.rpcUrl,
      });
      loadConfig();
      console.log(`✓ Configuration saved to ${envPath}\n`);

      const { runMigrations } = await import("../infra/database/migrations/index.js");
      await runMigrations();
      console.log("✓ Database migrations complete");

      const result = await initializeWithData({
        keyMaterial,
        appMaterial,
        id: data.id,
      });
      console.log("✓ Portal saved");
      if (result.apiKeySaved) {
        console.log("✓ API key saved");
      } else {
        console.log("✓ API key already exists");
      }

      console.log("\nStarting services...");
      setupShutdownHandlers();
      startAll();

      console.log(`
✓ Fileverse API is running!

  API Server: http://127.0.0.1:${options.port}
  Worker:     Active

Open this link for CLI and API guide: http://127.0.0.1:${options.port}

Share this with your LLM: http://127.0.0.1:${options.port}/llm.txt

Press Ctrl+C to stop.
`);

      await waitForProcesses();
    } catch (error) {
      console.error("\n❌ Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
