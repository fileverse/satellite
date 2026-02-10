import getDb from "../index";
import { logger } from "../../";

const STABLE_SCHEMA = `
CREATE TABLE IF NOT EXISTS files (
  _id TEXT PRIMARY KEY,
  ddocId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  localVersion INTEGER NOT NULL DEFAULT 1,
  onchainVersion INTEGER NOT NULL DEFAULT 0,
  syncStatus TEXT NOT NULL DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  portalAddress TEXT NOT NULL,
  metadata TEXT DEFAULT '{}',
  onChainFileId INTEGER,
  commentKey TEXT,
  linkKey TEXT,
  linkKeyNonce TEXT,
  link TEXT
);
CREATE INDEX IF NOT EXISTS idx_files_createdAt ON files(createdAt);
CREATE INDEX IF NOT EXISTS idx_files_syncStatus ON files(syncStatus);
CREATE INDEX IF NOT EXISTS idx_files_title ON files(title);
CREATE INDEX IF NOT EXISTS idx_files_portalAddress ON files(portalAddress);

CREATE TABLE IF NOT EXISTS portals (
  _id TEXT PRIMARY KEY,
  portalAddress TEXT NOT NULL UNIQUE,
  portalSeed TEXT NOT NULL UNIQUE,
  ownerAddress TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
  _id TEXT PRIMARY KEY,
  apiKeySeed TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL UNIQUE,
  collaboratorAddress TEXT NOT NULL UNIQUE,
  portalAddress TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  isDeleted INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  _id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('create', 'update', 'delete')),
  timestamp INTEGER NOT NULL,
  fileId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
  retryCount INTEGER NOT NULL DEFAULT 0,
  lastError TEXT,
  lockedAt INTEGER,
  nextRetryAt INTEGER,
  userOpHash TEXT,
  pendingPayload TEXT,
  portalAddress TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_pending_eligible ON events (status, nextRetryAt, timestamp) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_events_file_pending_ts ON events (fileId, status, timestamp) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_events_processing_locked ON events (status, lockedAt) WHERE status = 'processing';
CREATE INDEX IF NOT EXISTS idx_events_failed_portal ON events (portalAddress, status) WHERE status = 'failed';

CREATE TABLE IF NOT EXISTS folders (
  _id TEXT PRIMARY KEY,
  onchainFileId INTEGER NOT NULL,
  folderId TEXT NOT NULL,
  folderRef TEXT NOT NULL,
  folderName TEXT NOT NULL,
  portalAddress TEXT NOT NULL,
  metadataIPFSHash TEXT NOT NULL,
  contentIPFSHash TEXT NOT NULL,
  isDeleted INTEGER NOT NULL DEFAULT 0,
  lastTransactionHash TEXT,
  lastTransactionBlockNumber INTEGER NOT NULL,
  lastTransactionBlockTimestamp INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_folders_folderRef_folderId ON folders(folderRef, folderId);
CREATE INDEX IF NOT EXISTS idx_folders_folderRef ON folders(folderRef);
CREATE INDEX IF NOT EXISTS idx_folders_created_at ON folders(created_at);
`;

export function runMigrations(): void {
  const db = getDb();
  db.exec(STABLE_SCHEMA);
  logger.debug("Database schema ready");
}
