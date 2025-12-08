import db from './index';
import { QueryOptions } from './types';

/**
 * Type-safe query builder helpers
 */
export class QueryBuilder {
  /**
   * Execute a SELECT query and return all rows
   */
  static select<T = any>(sql: string, params: any[] = []): T[] {
    const stmt = db.prepare(sql);
    return stmt.all(params) as T[];
  }

  /**
   * Execute a SELECT query and return first row
   */
  static selectOne<T = any>(sql: string, params: any[] = []): T | undefined {
    const stmt = db.prepare(sql);
    return stmt.get(params) as T | undefined;
  }

  /**
   * Execute an INSERT/UPDATE/DELETE query
   */
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

  /**
   * Execute multiple queries in a transaction
   */
  static transaction<T>(callback: () => T): T {
    return db.transaction(callback)();
  }

  /**
   * Build pagination SQL
   */
  static paginate(sql: string, options: QueryOptions = {}): string {
    let query = sql;
    
    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || 'ASC'}`;
    }
    
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }
    
    return query;
  }
}
