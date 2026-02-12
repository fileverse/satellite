import { FoldersModel } from "../../infra/database/models";
import type { ListFoldersParams, ListFoldersResult } from "../../types";

export default async function listFolders(params: ListFoldersParams): Promise<ListFoldersResult> {
  const { limit, skip } = params;

  const result = await FoldersModel.findAll(limit, skip);

  return {
    folders: result.folders,
    total: result.total,
    hasNext: result.hasNext,
  };
}
