import { FoldersModel } from "../../infra/database/models";
import type { CreateFolderInput, Folder } from "../../types";

export default async function createFolder(input: CreateFolderInput): Promise<Folder> {
  // Validate required fields
  if (!input.folderId) {
    throw new Error("folderId is required");
  }
  if (!input.folderRef) {
    throw new Error("folderRef is required");
  }
  if (!input.folderName) {
    throw new Error("folderName is required");
  }
  if (!input.portalAddress) {
    throw new Error("portalAddress is required");
  }

  // Check if folderRef already exists
  const existing = await FoldersModel.findByFolderRefAndId(input.folderRef, input.folderId);
  if (existing) {
    throw new Error("Folder with this folderRef and folderId already exists");
  }

  return FoldersModel.create(input);
}
