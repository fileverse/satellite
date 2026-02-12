export interface ExecuteResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

export interface DatabaseAdapter {
  select<T>(sql: string, params?: any[]): Promise<T[]>;
  selectOne<T>(sql: string, params?: any[]): Promise<T | undefined>;
  execute(sql: string, params?: any[]): Promise<ExecuteResult>;
  transaction<T>(callback: () => Promise<T>): Promise<T>;
  exec(sql: string): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
  readonly dialect: "sqlite" | "postgres";
}
