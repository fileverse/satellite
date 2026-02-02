/**
 * Migration: add_file_fields
 * Generated: 2026-02-02T21:01:54.532Z
 */
export const up = `
  ALTER TABLE files ADD COLUMN commentKey TEXT;
  ALTER TABLE files ADD COLUMN linkKey TEXT;
  ALTER TABLE files ADD COLUMN linkKeyNonce TEXT;
`;

export const down = `
  ALTER TABLE files DROP COLUMN commentKey;
  ALTER TABLE files DROP COLUMN linkKey;
  ALTER TABLE files DROP COLUMN linkKeyNonce;
`;
