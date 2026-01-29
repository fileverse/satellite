/**
 * Migration: add_portal_fields_to_files
 * Generated: 2026-01-28T00:00:00.000Z
 */
export const up = `
  ALTER TABLE files ADD COLUMN portalAddress TEXT NOT NULL;
  ALTER TABLE files ADD COLUMN metadata TEXT DEFAULT '{}';
  ALTER TABLE files ADD COLUMN onChainFileId INTEGER;
  
  CREATE INDEX IF NOT EXISTS idx_files_portalAddress ON files(portalAddress);
`;

export const down = `
  DROP INDEX IF EXISTS idx_files_portalAddress;
  ALTER TABLE files DROP COLUMN onChainFileId;
  ALTER TABLE files DROP COLUMN metadata;
  ALTER TABLE files DROP COLUMN portalAddress;
`;
