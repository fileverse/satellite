import getDb from '../index';
import { logger } from '../../';

interface MigrationFile {
  timestamp: string;
  name: string;
  up: string;
  down?: string;
}

const migrations: MigrationFile[] = [
  {
    timestamp: '20240101120000',
    name: 'initial_schema',
    up: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        timestamp TEXT PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
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
      
      CREATE INDEX IF NOT EXISTS idx_files_createdAt ON files(createdAt);
      CREATE INDEX IF NOT EXISTS idx_files_syncStatus ON files(syncStatus);
      CREATE INDEX IF NOT EXISTS idx_files_title ON files(title);
    `,
    down: `
      DROP TABLE IF EXISTS files;
      DROP TABLE IF EXISTS schema_migrations;
    `,
  },
  {
    timestamp: '20251217122141',
    name: 'add_is_deleted_to_files',
    up: `ALTER TABLE files ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;`,
    down: `ALTER TABLE files DROP COLUMN isDeleted;`,
  },
  {
    timestamp: '20260127180254',
    name: 'add_portals_table',
    up: `
      CREATE TABLE IF NOT EXISTS portals(
        _id TEXT PRIMARY KEY,
        portalAddress TEXT NOT NULL UNIQUE,
        portalSeed TEXT NOT NULL UNIQUE,
        ownerAddress TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS portals;`,
  },
  {
    timestamp: '20260127181448',
    name: 'add_api_keys_table',
    up: `
      CREATE TABLE IF NOT EXISTS api_keys (
        _id TEXT PRIMARY KEY,
        apiKeySeed TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL UNIQUE,
        collaboratorAddress TEXT NOT NULL UNIQUE,
        portalAddress TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS api_keys;`,
  },
  {
    timestamp: '20260127223128',
    name: 'add_is_deleted_to_api_keys',
    up: `ALTER TABLE api_keys ADD COLUMN isDeleted INTEGER NOT NULL DEFAULT 0;`,
    down: `ALTER TABLE api_keys DROP COLUMN isDeleted;`,
  },
  {
    timestamp: '20260128141543',
    name: 'add_portal_fields_to_files',
    up: `
      ALTER TABLE files ADD COLUMN portalAddress TEXT NOT NULL;
      ALTER TABLE files ADD COLUMN metadata TEXT DEFAULT '{}';
      ALTER TABLE files ADD COLUMN onChainFileId INTEGER;
      
      CREATE INDEX IF NOT EXISTS idx_files_portalAddress ON files(portalAddress);
    `,
    down: `
      DROP INDEX IF EXISTS idx_files_portalAddress;
      ALTER TABLE files DROP COLUMN onChainFileId;
      ALTER TABLE files DROP COLUMN metadata;
      ALTER TABLE files DROP COLUMN portalAddress;
    `,
  },
  {
    timestamp: '20260203023154',
    name: 'add_file_fields',
    up: `
      ALTER TABLE files ADD COLUMN commentKey TEXT;
      ALTER TABLE files ADD COLUMN linkKey TEXT;
      ALTER TABLE files ADD COLUMN linkKeyNonce TEXT;
    `,
    down: `
      ALTER TABLE files DROP COLUMN commentKey;
      ALTER TABLE files DROP COLUMN linkKey;
      ALTER TABLE files DROP COLUMN linkKeyNonce;
    `,
  },
  {
    timestamp: '20260204120000',
    name: 'add_events_table',
    up: `
      CREATE TABLE IF NOT EXISTS events (
        _id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('create', 'update', 'delete')),
        timestamp INTEGER NOT NULL,
        fileId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed'))
      );
      CREATE INDEX IF NOT EXISTS idx_events_status_timestamp ON events(status, timestamp);
    `,
    down: `
      DROP INDEX IF EXISTS idx_events_status_timestamp;
      DROP TABLE IF EXISTS events;
    `,
  },
  {
    timestamp: '20260205100000',
    name: 'add_events_retry_and_backoff',
    up: `
      -- SQLite doesn't allow modifying CHECK constraints, so we recreate the table
      DROP INDEX IF EXISTS idx_events_status_timestamp;

      CREATE TABLE events_new (
        _id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('create', 'update', 'delete')),
        timestamp INTEGER NOT NULL,
        fileId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'processed', 'failed')),
        retryCount INTEGER NOT NULL DEFAULT 0,
        lastError TEXT,
        lockedAt INTEGER,
        nextRetryAt INTEGER
      );

      INSERT INTO events_new (_id, type, timestamp, fileId, status, retryCount, lastError, lockedAt, nextRetryAt)
      SELECT _id, type, timestamp, fileId, 
        CASE WHEN status = 'processing' THEN 'pending' ELSE status END,
        0, NULL, NULL, NULL
      FROM events;

      DROP TABLE events;
      ALTER TABLE events_new RENAME TO events;

      CREATE INDEX IF NOT EXISTS idx_events_pending_eligible 
        ON events (status, nextRetryAt, timestamp) 
        WHERE status = 'pending';

      CREATE INDEX IF NOT EXISTS idx_events_file_pending_ts 
        ON events (fileId, status, timestamp) 
        WHERE status = 'pending';

      CREATE INDEX IF NOT EXISTS idx_events_processing_locked 
        ON events (status, lockedAt) 
        WHERE status = 'processing';
    `,
    down: `
      DROP INDEX IF EXISTS idx_events_processing_locked;
      DROP INDEX IF EXISTS idx_events_file_pending_ts;
      DROP INDEX IF EXISTS idx_events_pending_eligible;

      CREATE TABLE events_old (
        _id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('create', 'update', 'delete')),
        timestamp INTEGER NOT NULL,
        fileId TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'processed'))
      );

      INSERT INTO events_old (_id, type, timestamp, fileId, status)
      SELECT _id, type, timestamp, fileId,
        CASE WHEN status = 'pending' THEN 'processing' ELSE 'processed' END
      FROM events WHERE status IN ('pending', 'processing', 'processed');

      DROP TABLE events;
      ALTER TABLE events_old RENAME TO events;

      CREATE INDEX IF NOT EXISTS idx_events_status_timestamp ON events(status, timestamp);
    `,
  },
];

export function runMigrations(): void {
  const db = getDb();
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      timestamp TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const getAppliedMigrations = db.prepare(
    'SELECT timestamp FROM schema_migrations'
  );
  const insertMigration = db.prepare(
    'INSERT INTO schema_migrations (timestamp) VALUES (?)'
  );

  const appliedMigrations = new Set(
    (getAppliedMigrations.all() as { timestamp: string }[]).map(
      (m) => m.timestamp
    )
  );

  const pendingMigrations = migrations.filter(
    (m) => !appliedMigrations.has(m.timestamp)
  );

  if (pendingMigrations.length === 0) {
    logger.info('Database is up to date');
    return;
  }

  db.transaction(() => {
    for (const migration of pendingMigrations) {
      logger.info(`Running migration ${migration.timestamp}_${migration.name}...`);
      db.exec(migration.up);
      insertMigration.run(migration.timestamp);
    }
  })();

  logger.info(`Applied ${pendingMigrations.length} migration(s)`);
}

export function rollbackMigrations(count: number = 1): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('Migration rollback is not allowed in production environment');
  }

  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      timestamp TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const getAppliedMigrations = db.prepare(
    'SELECT timestamp FROM schema_migrations ORDER BY timestamp DESC'
  );
  const deleteMigration = db.prepare(
    'DELETE FROM schema_migrations WHERE timestamp = ?'
  );

  const appliedMigrations = getAppliedMigrations.all() as { timestamp: string }[];

  if (appliedMigrations.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const migrationsToRollback = appliedMigrations.slice(0, count);
  const migrationMap = new Map(migrations.map((m) => [m.timestamp, m]));

  db.transaction(() => {
    for (const appliedMigration of migrationsToRollback) {
      const migration = migrationMap.get(appliedMigration.timestamp);

      if (!migration) {
        logger.warn(
          `Migration file not found for timestamp ${appliedMigration.timestamp}, removing from schema_migrations`
        );
        deleteMigration.run(appliedMigration.timestamp);
        continue;
      }

      if (!migration.down) {
        logger.warn(
          `Migration ${migration.timestamp}_${migration.name} has no 'down' function, skipping rollback`
        );
        deleteMigration.run(appliedMigration.timestamp);
        continue;
      }

      logger.info(`Rolling back migration ${migration.timestamp}_${migration.name}...`);
      db.exec(migration.down);
      deleteMigration.run(appliedMigration.timestamp);
    }
  })();

  logger.info(`Rolled back ${migrationsToRollback.length} migration(s)`);
}
