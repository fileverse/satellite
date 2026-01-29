import { FileEntity } from './FileEntity';

export interface ListFilesParams {
  limit: number;
  skip: number;
  portalAddress: string;
}

export interface GetFileParams {
  ddocId: string,
  portalAddress: string;
}

export interface ListFilesResult {
  files: FileEntity[];
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
