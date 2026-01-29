import type Database from "better-sqlite3";

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

  execute(sql: string, params: unknown[] = []): void {
    const stmt = this.db.prepare(sql);
    stmt.run(params);
  }
}