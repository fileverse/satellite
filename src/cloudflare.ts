/**
 * Cloudflare Workers barrel export.
 *
 * Re-exports everything the Cloudflare Worker template needs without
 * pulling in Node-only code (Express, multer, better-sqlite3, etc.).
 */

// Database adapter injection + query layer
export { setAdapter, getAdapter, closeAdapter, QueryBuilder } from "./infra/database/index.js";
export type { DatabaseAdapter, ExecuteResult } from "./infra/database/adapters/index.js";

// Migrations
export { runMigrations } from "./infra/database/migrations/index.js";

// Models
export { FilesModel, EventsModel, PortalsModel, ApiKeysModel, FoldersModel } from "./infra/database/models/index.js";

// Domain — files
export { listFiles, getFile, createFile, updateFile, deleteFile } from "./domain/file/index.js";

// Domain — folders
export { listFolders, getFolder, createFolder } from "./domain/folder/index.js";

// Domain — search
export { searchNodes } from "./domain/search/index.js";

// Domain — portal
export { handleNewFileOp, handleExistingFileOp, getProxyAuthParams, savePortal, addApiKey } from "./domain/portal/index.js";

// Initialization
export { initializeFromApiKey, initializeWithData, decryptSavedData } from "./init/index.js";

// Worker event processor
export { processEvent } from "./infra/worker/eventProcessor.js";

// Config
export { getRuntimeConfig } from "./config/index.js";

// MCP
export { createMcpServer } from "./mcp/server.js";
export type { FileverseConfig } from "./mcp/types.js";

// Types
export type * from "./types/index.js";
