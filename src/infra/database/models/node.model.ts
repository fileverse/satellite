export type NodeType = 'file' | 'folder';

export interface Node {
  _id: string;
  type: NodeType;
  name: string; // title for files, folderName for folders
  onchainFileId?: number;
  portalAddress: string;
  isDeleted: boolean;
  created_at: string;
  updated_at: string;
  contentIPFSHash?: string; 
  metadataIPFSHash?: string;
  gateIPFSHash?: string;
  lastTransactionHash?: string;
  lastTransactionBlockNumber?: number;
  lastTransactionBlockTimestamp?: number;
}
