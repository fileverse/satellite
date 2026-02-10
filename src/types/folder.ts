import type { Folder } from "./entities";

export interface ListFoldersParams {
  limit?: number;
  skip?: number;
}

export interface ListFoldersResult {
  folders: Folder[];
  total: number;
  hasNext: boolean;
}

export interface CreateFolderInput {
  _id?: string;
  onchainFileId: number;
  folderId: string;
  folderRef: string;
  folderName: string;
  portalAddress: string;
  metadataIPFSHash: string;
  contentIPFSHash: string;
  lastTransactionHash?: string;
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
}
