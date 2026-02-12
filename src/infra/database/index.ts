import { getAdapter, closeAdapter, initializeAdapter, initializeWithUrl } from "./connection.js";
import { QueryBuilder } from "./query-builder.js";

const closeDatabase = async (): Promise<void> => {
  await closeAdapter();
};

export { getAdapter, initializeAdapter, initializeWithUrl, closeAdapter, closeDatabase, QueryBuilder };
