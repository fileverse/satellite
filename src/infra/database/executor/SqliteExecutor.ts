import type Database from "better-sqlite3";

export interface ExecuteResult {
  changes: number;
  lastInsertRowid?: number | bigint;
}

export class SqliteExecutor {
  constructor(private readonly db: Database.Database) {}

  selectAll<T>(sql: string, params: unknown[] = []): T[] {
    const stmt = this.db.prepare(sql);
    return stmt.all(params) as T[];
  }

  selectOne<T>(sql: string, params: unknown[] = []): T | null {
    const stmt = this.db.prepare(sql);
    const row = stmt.get(params) as T | undefined;
    return row ?? null;
  }

  execute(sql: string, params: unknown[] = []): ExecuteResult {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    }
  }
}