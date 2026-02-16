import type { FileEntity, Folder } from "./entities";

export interface SearchNodesParams {
  query: string;
  limit?: number;
  skip?: number;
  portalAddress: string;
}

export type SearchNode = ({ type: "file" } & FileEntity) | ({ type: "folder" } & Folder);

export interface SearchNodesResult {
  nodes: SearchNode[];
  total: number;
  hasNext: boolean;
}
