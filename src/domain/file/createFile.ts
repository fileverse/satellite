import { FilesModel, File } from '../../infra/database/models/files.model';

export interface CreateFileInput {
  _id?: string;
  fileId: number;
  ddocId: string;
  title: string;
  content?: string;
  portalAddress: string;
  metadataIPFSHash: string;
  contentIPFSHash: string;
  gateIPFSHash: string;
  fileType?: string;
  folderRef?: string;
  lastTransactionBlockNumber: number;
  lastTransactionBlockTimestamp: number;
  createdBlockTimestamp: number;
}

/**
 * Domain function to create a new file/ddoc
 * Business logic layer - handles file creation operations
 */
export default function createFile(input: CreateFileInput): File {
  // Validate required fields
  if (!input.ddocId) {
    throw new Error('ddocId is required');
  }
  if (!input.title) {
    throw new Error('title is required');
  }
  if (!input.portalAddress) {
    throw new Error('portalAddress is required');
  }

  // Check if ddocId already exists
  const existing = FilesModel.findByDDocId(input.ddocId);
  if (existing) {
    throw new Error('File with this ddocId already exists');
  }

  return FilesModel.create(input);
}
