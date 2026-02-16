export interface FileEntity {
  _id: string;
  title: string;
  content: string;
  ddocId: string;
  localVersion: number;
  onchainVersion: number;
  syncStatus: "pending" | "synced" | "failed";
  isDeleted: number;
  onChainFileId: number | null;
  portalAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  linkKey: string;
  linkKeyNonce: string;
  commentKey: string;
  link?: string | null;
  derivedKey: string;
  secretKey: string;
}

export interface FileListResponse {
  ddocs: FileEntity[];
  total: number;
  hasNext: boolean;
}

export interface Folder {
  _id: string;
  onchainFileId: number;
  folderId: string;
  folderRef: string;
  folderName: string;
  portalAddress: string;
  metadataIPFSHash: string;
  contentIPFSHash: string;
  isDeleted: boolean;
  lastTransactionHash?: string;
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
  created_at: string;
  updated_at: string;
}

export interface FolderWithDDocs extends Folder {
  ddocs: FileEntity[];
}

export interface FolderListResponse {
  folders: Folder[];
  total: number;
  hasNext: boolean;
}

export interface Portal {
  _id: string;
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  _id: string;
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
  createdAt: string;
  isDeleted: number;
}

export type EventType = "create" | "update" | "delete";
export type EventStatus = "pending" | "processing" | "processed" | "failed" | "submitted";

export interface Event {
  _id: string;
  type: EventType;
  timestamp: number;
  fileId: string;
  portalAddress: string;
  status: EventStatus;
  retryCount: number;
  lastError: string | null;
  lockedAt: number | null;
  nextRetryAt: number | null;
  userOpHash?: string | null;
  pendingPayload?: string | null;
}
