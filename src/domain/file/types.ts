import { File } from '../../infra/database/models';

export interface ListFilesParams {
  limit?: number;
  skip?: number;
}

export interface ListFilesResult {
  ddocs: File[];
  total: number;
  hasNext: boolean;
}

export interface CreateFileInput {
  title: string;
  content: string;
}

export interface UpdateFileInput {
  title?: string;
  content?: string;
}
