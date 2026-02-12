import Database from "better-sqlite3";
import type { DatabaseAdapter, ExecuteResult } from "./adapter.js";
import { logger } from "../../index.js";

export class SqliteAdapter implements DatabaseAdapter {
  private db: Database.Database | null = null;
  readonly dialect = "sqlite" as const;

  constructor(private dbPath: string) {}

  private getDb(): Database.Database {
    if (!this.db) {
      this.db = new Database(this.dbPath);
      this.db.pragma("journal_mode = WAL");
      this.db.pragma("foreign_keys = ON");
      this.db.prepare("SELECT 1").get();
      logger.info(`SQLite database connected: ${this.dbPath}`);
    }
    return this.db;
  }

  async select<T>(sql: string, params: any[] = []): Promise<T[]> {
    const stmt = this.getDb().prepare(sql);
    return stmt.all(params) as T[];
  }

  async selectOne<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const stmt = this.getDb().prepare(sql);
    return stmt.get(params) as T | undefined;
  }

  async execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
    const stmt = this.getDb().prepare(sql);
    const result = stmt.run(params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const db = this.getDb();
    const savepointName = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.exec(`SAVEPOINT ${savepointName}`);
    try {
      const result = await callback();
      db.exec(`RELEASE ${savepointName}`);
      return result;
    } catch (error) {
      db.exec(`ROLLBACK TO ${savepointName}`);
      db.exec(`RELEASE ${savepointName}`);
      throw error;
    }
  }

  async exec(sql: string): Promise<void> {
    this.getDb().exec(sql);
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info("Database connection closed");
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.db.open;
  }
}
