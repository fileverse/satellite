export interface SatelliteConfig {
  serverUrl: string;
  apiKey: string;
}

export interface DocumentResult {
  ddocId: string;
  title: string;
  content: string;
  syncStatus: "pending" | "synced" | "failed";
  link: string | null;
  localVersion: number;
  onchainVersion: number;
  isDeleted: number;
  onChainFileId: number | null;
  portalAddress: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListDocumentsResult {
  ddocs: DocumentResult[];
  total: number;
  hasNext: boolean;
}

export interface SearchResult {
  nodes: DocumentResult[];
  total: number;
  hasNext: boolean;
}

export interface CreateDocumentResponse {
  message: string;
  data: DocumentResult;
}

export interface UpdateDocumentResponse {
  message: string;
  data: DocumentResult;
}

export interface RetryFailedResponse {
  retried: number;
}
