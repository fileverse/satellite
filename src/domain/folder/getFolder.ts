import { FoldersModel, type FolderWithDDocs } from "../../infra/database/models";

export default async function getFolder(folderRef: string, folderId: string): Promise<FolderWithDDocs | null> {
  if (!folderRef || !folderId) {
    throw new Error("folderRef and folderId are required");
  }

  const folder = await FoldersModel.findByFolderRefAndId(folderRef, folderId);

  if (!folder) {
    return null;
  }

  return folder;
}
