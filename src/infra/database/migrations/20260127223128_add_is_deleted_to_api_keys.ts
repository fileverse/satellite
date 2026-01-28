/**
 * Migration: add_is_deleted_to_api_keys
 * Generated: 2026-01-27T19:00:00.000Z
 */
export const up = `
  ALTER TABLE api_keys ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;
`;

export const down = `
  ALTER TABLE api_keys DROP COLUMN isDeleted;
`;
