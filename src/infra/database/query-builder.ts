import { databaseConnectionManager } from './connection';
import { QueryOptions } from './types';

const db = databaseConnectionManager.getConnection();

export class QueryBuilder {

  static select<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(params) as T[];
  }

  static selectOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = db.prepare(sql);
    return stmt.get(params) as T | undefined;
  }

  static execute(sql: string, params: any[] = []): {
    changes: number;
    lastInsertRowid: number | bigint;
  } {
    const stmt = db.prepare(sql);
    const result = stmt.run(params);
    return {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  static transaction<T>(callback: () => T): T {
    return db.transaction(callback)();
  }
}
