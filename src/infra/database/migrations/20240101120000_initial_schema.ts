/**
 * Initial database schema migration
 * Creates tables for files, folders, and schema_migrations
 */
export const up = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    timestamp TEXT PRIMARY KEY,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Files/DDocs table
  CREATE TABLE IF NOT EXISTS files (
    _id TEXT PRIMARY KEY,
    onchainFileId INTEGER NOT NULL UNIQUE,
    ddocId TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT,
    contentDecrypted TEXT,
    portalAddress TEXT NOT NULL,
    metadataIPFSHash TEXT NOT NULL,
    contentIPFSHash TEXT NOT NULL,
    gateIPFSHash TEXT NOT NULL,
    fileType TEXT NOT NULL DEFAULT 'ddoc',
    isDeleted INTEGER NOT NULL DEFAULT 0,
    folderRef TEXT,
    lastTransactionHash TEXT,
    lastTransactionBlockNumber INTEGER NOT NULL,
    lastTransactionBlockTimestamp INTEGER NOT NULL,
    createdBlockTimestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Folders table
  CREATE TABLE IF NOT EXISTS folders (
    _id TEXT PRIMARY KEY,
    onchainFileId INTEGER NOT NULL UNIQUE,
    folderId TEXT NOT NULL UNIQUE,
    folderRef TEXT NOT NULL UNIQUE,
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
  
  -- Indexes for files
  CREATE INDEX IF NOT EXISTS idx_files_ddocId ON files(ddocId);
  CREATE INDEX IF NOT EXISTS idx_files_folderRef ON files(folderRef);
  CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
  CREATE INDEX IF NOT EXISTS idx_files_isDeleted ON files(isDeleted);
  CREATE INDEX IF NOT EXISTS idx_files_portalAddress ON files(portalAddress);
  
  -- Indexes for folders
  CREATE INDEX IF NOT EXISTS idx_folders_folderId ON folders(folderId);
  CREATE INDEX IF NOT EXISTS idx_folders_folderRef ON folders(folderRef);
  CREATE INDEX IF NOT EXISTS idx_folders_folderName ON folders(folderName);
  CREATE INDEX IF NOT EXISTS idx_folders_created_at ON folders(created_at);
  CREATE INDEX IF NOT EXISTS idx_folders_isDeleted ON folders(isDeleted);
  CREATE INDEX IF NOT EXISTS idx_folders_portalAddress ON folders(portalAddress);
`;

export const down = `
  DROP TABLE IF EXISTS files;
  DROP TABLE IF EXISTS folders;
  DROP TABLE IF EXISTS schema_migrations;
`;
