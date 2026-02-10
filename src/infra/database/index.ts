import { databaseConnectionManager } from "./connection";
import { QueryBuilder } from "./query-builder";

function getDb() {
  return databaseConnectionManager.getConnection();
}

const closeDatabase = async (): Promise<void> => {
  await databaseConnectionManager.close();
};

export default getDb;
export { getDb, closeDatabase, QueryBuilder };
