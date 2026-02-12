import { getAdapter } from "./connection.js";
import type { QueryOptions } from "../../types";
import type { ExecuteResult } from "./adapters/index.js";
import { DEFAULT_LIST_LIMIT } from "../../domain/file/constants";

export class QueryBuilder {
  static async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const adapter = await getAdapter();
    return adapter.select<T>(sql, params);
  }

  static async selectOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const adapter = await getAdapter();
    return adapter.selectOne<T>(sql, params);
  }

  static async execute(sql: string, params: any[] = []): Promise<ExecuteResult> {
    const adapter = await getAdapter();
    return adapter.execute(sql, params);
  }

  static async transaction<T>(callback: () => Promise<T>): Promise<T> {
    const adapter = await getAdapter();
    return adapter.transaction(callback);
  }

  static paginate(sql: string, options: QueryOptions = {}): string {
    let query = sql;

    if (options.orderBy) {
      query += ` ORDER BY ${options.orderBy} ${options.orderDirection || "ASC"}`;
    }

    const hasOffset = (options.offset ?? 0) > 0;
    const limit = options.limit ?? (hasOffset ? DEFAULT_LIST_LIMIT : undefined);

    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    if (hasOffset) {
      query += ` OFFSET ${options.offset}`;
    }

    return query;
  }
}
