import type { DatabaseAdapter } from "./adapters/index.js";
import { logger } from "../index.js";
import path from "path";
import fs from "fs";

let adapter: DatabaseAdapter | null = null;

/**
 * Auto-detect and initialize the database adapter:
 * - DATABASE_URL env → PostgreSQL
 * - DB_PATH env → SQLite
 */
export async function initializeAdapter(): Promise<DatabaseAdapter> {
  if (adapter) return adapter;

  const databaseUrl = process.env.DATABASE_URL;
  const dbPath = process.env.DB_PATH;

  if (databaseUrl) {
    const { PostgresAdapter } = await import("./adapters/postgres-adapter.js");
    adapter = new PostgresAdapter(databaseUrl);
    logger.info("Using PostgreSQL adapter");
  } else if (dbPath) {
    // Ensure DB directory exists
    const dbDir = path.dirname(dbPath.trim());
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const { SqliteAdapter } = await import("./adapters/sqlite-adapter.js");
    adapter = new SqliteAdapter(dbPath);
    logger.info("Using SQLite adapter");
  } else {
    throw new Error(
      "No database configured. Set DATABASE_URL (PostgreSQL) or DB_PATH (SQLite).",
    );
  }

  return adapter;
}

/**
 * Returns the active adapter, lazy-initializing if needed.
 */
export async function getAdapter(): Promise<DatabaseAdapter> {
  if (!adapter) {
    return initializeAdapter();
  }
  return adapter;
}

/**
 * Graceful shutdown — close the active adapter.
 */
export async function closeAdapter(): Promise<void> {
  if (adapter) {
    await adapter.close();
    adapter = null;
  }
}
