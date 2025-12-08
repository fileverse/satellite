import { FoldersModel } from '../../infra/database/models/folders.model';
import { Folder } from '../../infra/database/models/folders.model';

export interface ListFoldersParams {
  limit?: number;
  skip?: number;
}

export interface ListFoldersResult {
  folders: Folder[];
  total: number;
  hasNext: boolean;
}

/**
 * Domain function to list all folders
 * Business logic layer - handles folder listing operations
 */
export default function listFolders(params: ListFoldersParams): ListFoldersResult {
  const { limit, skip } = params;
  
  const result = FoldersModel.findAll(limit, skip);
  
  return {
    folders: result.folders,
    total: result.total,
    hasNext: result.hasNext
  };
}
