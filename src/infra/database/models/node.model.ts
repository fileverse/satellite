/**
 * Node - Normalized schema for Files and Folders
 * Represents a unified entity that can be either a File or Folder
 */
export type NodeType = 'file' | 'folder';

export interface Node {
  // Common fields
  _id: string;
  type: NodeType;
  name: string; // title for files, folderName for folders
  portalAddress: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  
  // File-specific fields (only present when type === 'file')
  fileId?: number;
  ddocId?: string;
  title?: string; // Same as name, kept for compatibility
  content?: string;
  fileMetadataIPFSHash?: string; // Renamed to avoid conflict
  contentIPFSHash?: string;
  gateIPFSHash?: string;
  fileType?: string;
  fileFolderRef?: string; // Renamed to avoid conflict
  fileLastTransactionBlockNumber?: number; // Renamed to avoid conflict
  fileLastTransactionBlockTimestamp?: number; // Renamed to avoid conflict
  createdBlockTimestamp?: number;
  
  // Folder-specific fields (only present when type === 'folder')
  folderId?: string;
  folderRef?: string;
  folderName?: string; // Same as name, kept for compatibility
  folderMetadataIPFSHash?: string; // Renamed to avoid conflict
  resolvedMetadata?: {
    name: string;
    description?: string;
  };
  folderLastTransactionBlockNumber?: number; // Renamed to avoid conflict
  folderLastTransactionBlockTimestamp?: number; // Renamed to avoid conflict
}
