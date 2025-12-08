import { FilesModel } from '../../infra/database/models/files.model';
import { FoldersModel } from '../../infra/database/models/folders.model';
import { Node } from '../../infra/database/models/node.model';

export interface SearchNodesParams {
  query: string;
  limit?: number;
  skip?: number;
}

export interface SearchNodesResult {
  nodes: Node[];
  total: number;
  hasNext: boolean;
}

/**
 * Domain function to search both Files and Folders
 * Returns normalized Node entities
 */
export default function searchNodes(params: SearchNodesParams): SearchNodesResult {
  const { query, limit, skip } = params;

  if (!query || query.trim().length === 0) {
    return { nodes: [], total: 0, hasNext: false };
  }

  // Search files by title
  const files = FilesModel.searchByTitle(query, limit, skip);
  
  // Search folders by folderName
  const folders = FoldersModel.searchByName(query, limit, skip);

  // Normalize to Node schema
  const fileNodes: Node[] = files.map(file => ({
    _id: file._id,
    type: 'file' as const,
    name: file.title,
    portalAddress: file.portalAddress,
    isDeleted: file.isDeleted,
    created_at: file.created_at,
    updated_at: file.updated_at,
    fileId: file.fileId,
    ddocId: file.ddocId,
    title: file.title,
    content: file.content,
    fileMetadataIPFSHash: file.metadataIPFSHash,
    contentIPFSHash: file.contentIPFSHash,
    gateIPFSHash: file.gateIPFSHash,
    fileType: file.fileType,
    fileFolderRef: file.folderRef,
    fileLastTransactionBlockNumber: file.lastTransactionBlockNumber,
    fileLastTransactionBlockTimestamp: file.lastTransactionBlockTimestamp,
    createdBlockTimestamp: file.createdBlockTimestamp,
  }));

  const folderNodes: Node[] = folders.map(folder => ({
    _id: folder._id,
    type: 'folder' as const,
    name: folder.folderName,
    portalAddress: folder.portalAddress,
    isDeleted: folder.isDeleted,
    created_at: folder.created_at,
    updated_at: folder.updated_at,
    folderId: folder.folderId,
    folderRef: folder.folderRef,
    folderName: folder.folderName,
    folderMetadataIPFSHash: folder.metadataIPFSHash,
    resolvedMetadata: folder.resolvedMetadata,
    folderLastTransactionBlockNumber: folder.lastTransactionBlockNumber,
    folderLastTransactionBlockTimestamp: folder.lastTransactionBlockTimestamp,
  }));

  // Combine and sort by created_at (most recent first)
  const allNodes = [...fileNodes, ...folderNodes].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA;
  });

  // Apply pagination if needed
  const total = allNodes.length;
  let paginatedNodes = allNodes;
  
  if (skip !== undefined || limit !== undefined) {
    const start = skip || 0;
    const end = limit !== undefined ? start + limit : undefined;
    paginatedNodes = allNodes.slice(start, end);
  }

  const hasNext = skip !== undefined && limit !== undefined 
    ? (skip + limit) < total 
    : false;

  return {
    nodes: paginatedNodes,
    total,
    hasNext
  };
}
