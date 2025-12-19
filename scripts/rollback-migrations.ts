/**
 * Rollback database migrations (development only)
 * Usage: npm run migrate:rollback [count]
 * 
 * Examples:
 *   npm run migrate:rollback        # Rollback 1 migration
 *   npm run migrate:rollback 2      # Rollback 2 migrations
 */
import { rollbackMigrations } from '../src/infra/database/migrations';
import { logger } from '../src/infra/logger';
import { config } from '../src/config';

// Get count from command line argument (default: 1)
const count = parseInt(process.argv[2] || '1', 10);

if (isNaN(count) || count < 1) {
  logger.error('Invalid count. Please provide a positive number.');
  process.exit(1);
}

// Safety check: only allow rollback in development
const nodeEnv = config.NODE_ENV || 'development';
if (nodeEnv === 'production') {
  logger.error('Migration rollback is not allowed in production environment');
  logger.error('Set NODE_ENV=development to use rollback');
  process.exit(1);
}

logger.info(`Rolling back ${count} migration(s) in ${nodeEnv} environment...`);

try {
  rollbackMigrations(count);
  logger.info('Rollback completed successfully');
  process.exit(0);
} catch (error: any) {
  logger.error('Rollback failed:', error);
  process.exit(1);
}

