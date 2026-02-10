import type { File, Folder } from "./entities";

export interface SearchNodesParams {
  query: string;
  limit?: number;
  skip?: number;
  portalAddress: string;
}

export type SearchNode = ({ type: "file" } & File) | ({ type: "folder" } & Folder);

export interface SearchNodesResult {
  nodes: SearchNode[];
  total: number;
  hasNext: boolean;
}
