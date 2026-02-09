import type { File } from "../../infra/database/models";

export interface ListFilesParams {
  limit?: number;
  skip?: number;
  portalAddress: string;
}

export type GetFileResult = Omit<File, "metadata" | "linkKey" | "linkKeyNonce" | "commentKey" | "meatadata" | "_id">;

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
