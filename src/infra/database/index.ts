import { databaseConnectionManager } from './connection';
import { QueryBuilder } from './query-builder';

/**
 * Default database connection instance
 * Use this for database operations
 */
const db = databaseConnectionManager.getConnection();

/**
 * Close database connection gracefully
 * Should be called during application shutdown
 */
async function closeDatabase(): Promise<void> {
  await databaseConnectionManager.close();
}

export default db;
export { closeDatabase, QueryBuilder };
