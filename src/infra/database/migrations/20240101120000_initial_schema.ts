/**
 * Initial database schema migration
 * Creates tables for files and schema_migrations
 */
export const up = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    timestamp TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Files/DDocs table
  CREATE TABLE IF NOT EXISTS files (
    _id TEXT PRIMARY KEY,
    ddocId TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    localVersion INTEGER NOT NULL DEFAULT 1,
    onchainVersion INTEGER NOT NULL DEFAULT 0,
    syncStatus TEXT NOT NULL DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Indexes for files
  CREATE INDEX IF NOT EXISTS idx_files_createdAt ON files(createdAt);
  CREATE INDEX IF NOT EXISTS idx_files_syncStatus ON files(syncStatus);
  CREATE INDEX IF NOT EXISTS idx_files_title ON files(title);
`;

export const down = `
  DROP TABLE IF EXISTS files;
  DROP TABLE IF EXISTS schema_migrations;
`;
