import Database from 'better-sqlite3';
import { config } from '../../config';
import { logger } from '../logger';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = config.DB_PATH || path.join(dataDir, 'satellite.db');

// Create database instance
const db = new Database(dbPath, {
  verbose: config.NODE_ENV === 'development' ? logger.info.bind(logger) : undefined,
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Connection health check
db.prepare('SELECT 1').get();

logger.info(`SQLite database connected: ${dbPath}`);

// Graceful shutdown
process.on('SIGINT', () => {
  db.close();
  logger.info('Database connection closed');
  process.exit(0);
});

export default db;
