import db from '../index';
import { logger } from '../../';
import fs from 'fs';
import path from 'path';

interface MigrationFile {
  timestamp: string;
  name: string;
  up: string;
  down?: string;
}

/**
 * Load all migration files from the migrations directory
 * Migration files should be named: YYYYMMDDHHMMSS_description.ts (or .js in compiled mode)
 */
function loadMigrations(): MigrationFile[] {
  const migrationsDir = __dirname;
  // Support both .ts (development) and .js (compiled) files
  const files = fs.readdirSync(migrationsDir)
    .filter(file => {
      const isMigrationFile = (file.endsWith('.ts') || file.endsWith('.js')) && 
                              file !== 'index.ts' && 
                              file !== 'index.js' &&
                              !file.endsWith('.js.map'); // Exclude source maps
      return isMigrationFile;
    })
    .sort(); // Sort alphabetically (which works for timestamp format)

  const migrations: MigrationFile[] = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    // Extract timestamp from filename (first 14 digits) - support both .ts and .js
    const match = file.match(/^(\d{14})_(.+)\.(ts|js)$/);

    if (!match) {
      logger.warn(`Skipping invalid migration file: ${file}`);
      continue;
    }

    const [, timestamp, name] = match;
    const migration = require(filePath);

    if (!migration.up) {
      logger.warn(`Migration ${file} is missing 'up' function`);
      continue;
    }

    migrations.push({
      timestamp,
      name,
      up: migration.up,
      down: migration.down
    });
  }

  return migrations;
}

/**
 * Run all pending migrations
 */
export function runMigrations(): void {
  // Create migrations table if it doesn't exist (with timestamp-based schema)
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      timestamp TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const getAppliedMigrations = db.prepare('SELECT timestamp FROM schema_migrations');
  const insertMigration = db.prepare('INSERT INTO schema_migrations (timestamp) VALUES (?)');

  const appliedMigrations = new Set(
    (getAppliedMigrations.all() as { timestamp: string }[]).map(m => m.timestamp)
  );

  const allMigrations = loadMigrations();
  const pendingMigrations = allMigrations.filter(m => !appliedMigrations.has(m.timestamp));

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

/**
 * Rollback migrations (development only)
 * @param count Number of migrations to rollback (default: 1)
 */
export function rollbackMigrations(count: number = 1): void {
  // Safety check: only allow rollback in development
  const nodeEnv = process.env.NODE_ENV || 'development';
  if (nodeEnv === 'production') {
    throw new Error('Migration rollback is not allowed in production environment');
  }

  // Ensure migrations table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      timestamp TEXT PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const getAppliedMigrations = db.prepare('SELECT timestamp FROM schema_migrations ORDER BY timestamp DESC');
  const deleteMigration = db.prepare('DELETE FROM schema_migrations WHERE timestamp = ?');

  const appliedMigrations = getAppliedMigrations.all() as { timestamp: string }[];

  if (appliedMigrations.length === 0) {
    logger.info('No migrations to rollback');
    return;
  }

  const migrationsToRollback = appliedMigrations.slice(0, count);
  const allMigrations = loadMigrations();
  const migrationMap = new Map(allMigrations.map(m => [m.timestamp, m]));

  db.transaction(() => {
    for (const appliedMigration of migrationsToRollback) {
      const migration = migrationMap.get(appliedMigration.timestamp);

      if (!migration) {
        logger.warn(`Migration file not found for timestamp ${appliedMigration.timestamp}, removing from schema_migrations`);
        deleteMigration.run(appliedMigration.timestamp);
        continue;
      }

      if (!migration.down) {
        logger.warn(`Migration ${migration.timestamp}_${migration.name} has no 'down' function, skipping rollback`);
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
