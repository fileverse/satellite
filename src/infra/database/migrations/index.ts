import db from '../index';
import { logger } from '../../logger';
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
 * Migration files should be named: YYYYMMDDHHMMSS_description.ts
 */
function loadMigrations(): MigrationFile[] {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    .sort(); // Sort alphabetically (which works for timestamp format)

  const migrations: MigrationFile[] = [];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    // Extract timestamp from filename (first 14 digits)
    const match = file.match(/^(\d{14})_(.+)\.ts$/);
    
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
