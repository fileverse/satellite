import { FoldersModel } from '../../infra/database/models/folders.model';
import { FolderWithDDocs } from '../../infra/database/models/folders.model';

/**
 * Domain function to get a single folder by folderRef and folderId
 * Business logic layer - handles folder retrieval operations
 */
export default function getFolder(folderRef: string, folderId: string): FolderWithDDocs | null {
  if (!folderRef || !folderId) {
    throw new Error('folderRef and folderId are required');
  }

  const folder = FoldersModel.findByFolderRefAndId(folderRef, folderId);
  
  if (!folder) {
    return null;
  }

  return folder;
}
