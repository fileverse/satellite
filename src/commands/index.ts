#!/usr/bin/env node
import { Command } from "commander";

// Import config early to validate DB_PATH
import "../config";

import { logger } from "../infra/logger";
logger.level = "error";

import { runMigrations } from "../infra/database/migrations";
runMigrations();

import { listCommand } from "./listCommand";
import { getCommand } from "./getCommand";
import { createCommand } from "./createCommand";
import { updateCommand } from "./updateCommand";
import { deleteCommand } from "./deleteCommand";
import { downloadCommand } from "./downloadCommand";
import { viewCommand } from "./viewCommand";
import { eventsCommand } from "./eventsCommand";
import { closeWorker, closeDatabase } from "../infra";

export const program = new Command()
  .name("ddctl")
  .description("CLI tool to manage your ddocs")
  .version("0.1.0")
  .addHelpText("beforeAll", "\n")
  .addHelpText("afterAll", "\n");

program.addCommand(listCommand);
program.addCommand(getCommand);
program.addCommand(createCommand);
program.addCommand(updateCommand);
program.addCommand(deleteCommand);
program.addCommand(downloadCommand);
program.addCommand(viewCommand);
program.addCommand(eventsCommand);

// Close connections and exit after command completes
program
  .parseAsync()
  .then(async () => {
    try {
      await closeWorker();
      await closeDatabase();
    } catch (error) {
      // Ignore errors during cleanup
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
