import { FilesModel, File } from '../../infra/database/models/files.model';
import { Folder } from '../../infra/database/models/folders.model';
import { QueryBuilder } from '../../infra/database/query-builder';

export interface SearchNodesParams {
  query: string;
  limit?: number;
  skip?: number;
}

/**
 * Normalized response type for search results
 * Can contain both files and folders at the API response level
 */
export type SearchNode = 
  | ({ type: 'file' } & File)
  | ({ type: 'folder' } & Folder);

export interface SearchNodesResult {
  nodes: SearchNode[];
  total: number;
  hasNext: boolean;
}

/**
 * Domain function to search files (for now)
 * Returns normalized response that can contain folder entries as well
 * Normalization is at the API response level, not schema level
 */
export default function searchNodes(params: SearchNodesParams): SearchNodesResult {
  const { query, limit, skip } = params;

  if (!query || query.trim().length === 0) {
    return { nodes: [], total: 0, hasNext: false };
  }

  // Search only files by title (for now)
  const files = FilesModel.searchByTitle(query, limit, skip);

  // Normalize files to SearchNode format
  const normalizedNodes: SearchNode[] = files.map(file => ({
    type: 'file' as const,
    ...file,
  }));

  // Get total count for pagination
  const countSql = `SELECT COUNT(*) as count FROM files WHERE isDeleted = 0 AND LOWER(title) LIKE LOWER(?)`;
  const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql, [`%${query}%`]);
  const total = totalResult?.count || 0;

  const hasNext = skip !== undefined && limit !== undefined 
    ? (skip + limit) < total 
    : false;

  return {
    nodes: normalizedNodes,
    total,
    hasNext
  };
}
