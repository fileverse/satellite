import { FilesModel } from "../../infra/database/models";
import { QueryBuilder } from "../../infra/database";
import type { SearchNodesParams, SearchNode, SearchNodesResult } from "../../types";

/**
 * Domain function to search files (for now)
 * Returns normalized response that can contain folder entries as well
 * Normalization is at the API response level, not schema level
 */
export default function searchNodes(params: SearchNodesParams): SearchNodesResult {
  const { query, limit, skip, portalAddress } = params;

  if (!query || query.trim().length === 0) {
    return { nodes: [], total: 0, hasNext: false };
  }

  // Search only files by title (for now)
  const files = FilesModel.searchByTitle(query, portalAddress, limit, skip);

  // Normalize files to SearchNode format
  const normalizedNodes: SearchNode[] = files.map((file) => ({
    type: "file" as const,
    ...file,
  }));

  // Get total count for pagination
  const countSql = `SELECT COUNT(*) as count FROM files WHERE LOWER(title) LIKE LOWER(?) AND isDeleted = 0 AND portalAddress = ?`;
  const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql, [`%${query}%`, portalAddress]);
  const total = totalResult?.count || 0;

  const hasNext = skip !== undefined && limit !== undefined ? skip + limit < total : false;

  return {
    nodes: normalizedNodes,
    total,
    hasNext,
  };
}
