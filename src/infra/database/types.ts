// Type definitions for database operations
export interface QueryResult<T = any> {
  rows: T[];
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}
