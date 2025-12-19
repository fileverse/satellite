/**
 * Run database migrations
 * Usage: npm run migrate
 */
import { runMigrations } from '../src/infra/database/migrations';
import { logger } from '../src/infra/logger';

logger.info('Running database migrations...');

try {
  runMigrations();
  logger.info('Migrations completed successfully');
  process.exit(0);
} catch (error: any) {
  logger.error('Migration failed:', error);
  process.exit(1);
}

