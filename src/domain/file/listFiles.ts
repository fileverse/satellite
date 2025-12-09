import { FilesModel, File } from '../../infra/database/models/files.model';

export interface ListFilesParams {
  limit?: number;
  skip?: number;
}

export interface ListFilesResult {
  ddocs: File[];
  total: number;
  hasNext: boolean;
}

export default function listFiles(params: ListFilesParams): ListFilesResult {
  const { limit, skip } = params;
  
  const result = FilesModel.findAll(limit, skip);
  
  return {
    ddocs: result.files,
    total: result.total,
    hasNext: result.hasNext
  };
}
