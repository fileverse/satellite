/**
 * Migration: add_portals_table
 * Generated: 2026-01-27T12:32:54.260Z
 */
export const up = `
  CREATE TABLE IF NOT EXISTS portals(
    _id TEXT PRIMARY KEY,
    portalAddress TEXT NOT NULL UNIQUE,
    portalSeed TEXT NOT NULL UNIQUE,
    ownerAddress TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

export const down = `
  DROP TABLE IF EXISTS portals;
`;
