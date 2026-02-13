import type { File } from "./entities";

export interface ListFilesParams {
  limit?: number;
  skip?: number;
  portalAddress: string;
}

export type GetFileResult = Omit<File, "metadata" | "linkKey" | "linkKeyNonce" | "commentKey" | "derivedKey" | "secretKey" | "_id">;

export interface ListFilesResult {
  ddocs: GetFileResult[];
  total: number;
  hasNext: boolean;
}

export interface CreateFileInput {
  title: string;
  content: string;
  portalAddress: string;
}

export interface UpdateFileInput {
  title?: string;
  content?: string;
}

export interface UpdateFilePayload {
  title?: string;
  content?: string;
  isDeleted?: number;
  localVersion?: number;
  onchainVersion?: number;
  syncStatus?: "pending" | "synced" | "failed";
  portalAddress?: string;
  metadata?: Record<string, unknown>;
  onChainFileId?: number;
  linkKey?: string;
  linkKeyNonce?: string;
  commentKey?: string;
  link?: string;
  derivedKey?: string;
  secretKey?: string;
}

export interface ClientUpdateFileInput {
  title?: string;
  content?: string;
}
