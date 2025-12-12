/**
 * Migration: add_is_deleted_to_files
 * Generated: 2025-12-17T06:51:41.860Z
 */
export const up = `
  ALTER TABLE files ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
`;

export const down = `
  ALTER TABLE files DROP COLUMN isDeleted;
`;
