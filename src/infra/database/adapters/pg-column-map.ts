/**
 * Static map of lowercase → camelCase column names.
 * PostgreSQL lowercases all unquoted identifiers, so query results come back
 * with lowercase keys. This map restores the original camelCase names.
 */
const COLUMN_MAP: Record<string, string> = {
  ddocid: "ddocId",
  localversion: "localVersion",
  onchainversion: "onchainVersion",
  syncstatus: "syncStatus",
  createdat: "createdAt",
  updatedat: "updatedAt",
  isdeleted: "isDeleted",
  portaladdress: "portalAddress",
  onchainfileid: "onChainFileId",
  commentkey: "commentKey",
  linkkey: "linkKey",
  linkkeynonce: "linkKeyNonce",
  derivedkey: "derivedKey",
  secretkey: "secretKey",
  portalseed: "portalSeed",
  owneraddress: "ownerAddress",
  apikeyseed: "apiKeySeed",
  collaboratoraddress: "collaboratorAddress",
  fileid: "fileId",
  retrycount: "retryCount",
  lasterror: "lastError",
  lockedat: "lockedAt",
  nextretryat: "nextRetryAt",
  userophash: "userOpHash",
  pendingpayload: "pendingPayload",
  folderid: "folderId",
  folderref: "folderRef",
  foldername: "folderName",
  metadataipfshash: "metadataIPFSHash",
  contentipfshash: "contentIPFSHash",
  lasttransactionhash: "lastTransactionHash",
  lasttransactionblocknumber: "lastTransactionBlockNumber",
  lasttransactionblocktimestamp: "lastTransactionBlockTimestamp",
  
};

export function remapRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const key in row) {
    out[COLUMN_MAP[key] ?? key] = row[key];
  }
  return out as T;
}

export function remapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => remapRow<T>(row));
}
