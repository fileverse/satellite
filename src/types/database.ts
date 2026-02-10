export interface QueryResult<T = unknown> {
  rows: T[];
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: "ASC" | "DESC";
}
