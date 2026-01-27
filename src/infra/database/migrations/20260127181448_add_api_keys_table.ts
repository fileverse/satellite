/**
 * Migration: add_api_keys_table
 * Generated: 2026-01-27T12:44:48.453Z
 */
export const up = `
  CREATE TABLE IF NOT EXISTS api_keys (
    _id TEXT PRIMARY KEY,
    apiKeySeed TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL UNIQUE,
    collaboratorAddress TEXT NOT NULL UNIQUE,
    portalAddress TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const down = `
  DROP TABLE IF EXISTS api_keys;
`;

