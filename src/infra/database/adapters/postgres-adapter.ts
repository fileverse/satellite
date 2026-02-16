import type { DatabaseAdapter, ExecuteResult } from "./adapter.js";
import { sqliteToPostgres } from "./sql-compat.js";
import { remapRows, remapRow } from "./pg-column-map.js";
import { logger } from "../../index.js";

// pg is lazy-imported so SQLite-only users don't need it installed
let pgModule: typeof import("pg") | null = null;

async function getPg() {
  if (!pgModule) {
    pgModule = await import("pg");
  }
  return pgModule;
}

export class PostgresAdapter implements DatabaseAdapter {
  private pool: InstanceType<typeof import("pg").Pool> | null = null;
  private connectionUrl: string;
  private connected = false;
  readonly dialect = "postgres" as const;

  constructor(connectionUrl: string) {
    this.connectionUrl = connectionUrl;
  }

  private async getPool() {
    if (!this.pool) {
      const pg = await getPg();
      this.pool = new pg.default.Pool({
        connectionString: this.connectionUrl,
        max: 10,
        ssl:
          this.connectionUrl.includes("sslmode=require") ||
          this.connectionUrl.includes("amazonaws.com") ||
          this.connectionUrl.includes("heroku")
            ? { rejectUnauthorized: false }
            : undefined,
      });
      // Verify connectivity
      const client = await this.pool.connect();
      client.release();
      this.connected = true;
      logger.info("PostgreSQL database connected");
    }
    return this.pool;
  }

  async select<T>(sql: string, params: any[] = []): Promise<T[]> {
    const pool = await this.getPool();
    const pgSql = sqliteToPostgres(sql);
    const result = await pool.query(pgSql, params);
    return remapRows<T>(result.rows);
  }

  async selectOne<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    const pool = await this.getPool();
    const pgSql = sqliteToPostgres(sql);
    const result = await pool.query(pgSql, params);
    return result.rows[0] ? remapRow<T>(result.rows[0]) : undefined;
  }

  async execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
    const pool = await this.getPool();
    const pgSql = sqliteToPostgres(sql);
    const result = await pool.query(pgSql, params);
    return {
      changes: result.rowCount ?? 0,
      lastInsertRowid: 0,
    };
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const pool = await this.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const result = await callback();
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async exec(sql: string): Promise<void> {
    const pool = await this.getPool();
    await pool.query(sql);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      this.connected = false;
      logger.info("Database connection closed");
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}
