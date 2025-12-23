import Database from 'better-sqlite3';
import { config } from '../../config';
import { logger } from '../index';
import path from 'path';
import fs from 'fs';

/**
 * Database connection manager - Singleton pattern
 * Provides a shared SQLite database connection
 */
class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private db: Database.Database | null = null;

  private constructor() { }

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  getConnection(): Database.Database {
    if (!this.db) {
      // DB_PATH is required, validated, and normalized in config/index.ts
      const dbPath = config.DB_PATH!;

      // Create database instance
      this.db = new Database(dbPath, {
        verbose: config.NODE_ENV === 'development' ? logger.info.bind(logger) : undefined,
      });

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      // Enable foreign keys
      this.db.pragma('foreign_keys = ON');

      // Connection health check
      this.db.prepare('SELECT 1').get();

      logger.info(`SQLite database connected: ${dbPath}`);
    }

    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.db.open;
  }
}

export const databaseConnectionManager = DatabaseConnectionManager.getInstance();

