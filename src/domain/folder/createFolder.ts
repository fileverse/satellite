import { FoldersModel, Folder } from '../../infra/database/models/folders.model';

export interface CreateFolderInput {
  _id?: string;
  folderId: string;
  folderRef: string;
  folderName: string;
  portalAddress: string;
  metadataIPFSHash: string;
  resolvedMetadata?: {
    name: string;
    description?: string;
  };
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
}

/**
 * Domain function to create a new folder
 * Business logic layer - handles folder creation operations
 */
export default function createFolder(input: CreateFolderInput): Folder {
  // Validate required fields
  if (!input.folderId) {
    throw new Error('folderId is required');
  }
  if (!input.folderRef) {
    throw new Error('folderRef is required');
  }
  if (!input.folderName) {
    throw new Error('folderName is required');
  }
  if (!input.portalAddress) {
    throw new Error('portalAddress is required');
  }

  // Check if folderRef already exists
  const existing = FoldersModel.findByFolderRefAndId(input.folderRef, input.folderId);
  if (existing) {
    throw new Error('Folder with this folderRef and folderId already exists');
  }

  return FoldersModel.create(input);
}
