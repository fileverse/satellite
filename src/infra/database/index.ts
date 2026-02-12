import { getAdapter, closeAdapter, initializeAdapter } from "./connection.js";
import { QueryBuilder } from "./query-builder.js";

const closeDatabase = async (): Promise<void> => {
  await closeAdapter();
};

export { getAdapter, initializeAdapter, closeAdapter, closeDatabase, QueryBuilder };
