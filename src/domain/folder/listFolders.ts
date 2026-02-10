import { FoldersModel } from "../../infra/database/models";
import type { ListFoldersParams, ListFoldersResult } from "../../types";

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
    hasNext: result.hasNext,
  };
}
