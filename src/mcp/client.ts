import type {
  FileverseConfig,
  DocumentResult,
  ListDocumentsResult,
  SearchResult,
  CreateDocumentResponse,
  UpdateDocumentResponse,
  RetryFailedResponse,
} from "./types.js";

export class FileverseClient {
  private serverUrl: string;
  private apiKey: string;

  constructor(config: FileverseConfig) {
    this.serverUrl = config.serverUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  private url(path: string, params?: Record<string, string>): string {
    const search = new URLSearchParams({ apiKey: this.apiKey, ...params });
    return `${this.serverUrl}${path}?${search.toString()}`;
  }

  private async request<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, init);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`HTTP ${res.status}: ${body}`);
    }
    return res.json() as Promise<T>;
  }

  async listDocuments(limit?: number, skip?: number): Promise<ListDocumentsResult> {
    const params: Record<string, string> = {};
    if (limit !== undefined) params.limit = String(limit);
    if (skip !== undefined) params.skip = String(skip);
    return this.request<ListDocumentsResult>(this.url("/api/ddocs", params));
  }

  async getDocument(ddocId: string): Promise<DocumentResult> {
    return this.request<DocumentResult>(this.url(`/api/ddocs/${ddocId}`));
  }

  async createDocument(title: string, content: string): Promise<CreateDocumentResponse> {
    return this.request<CreateDocumentResponse>(this.url("/api/ddocs"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
  }

  async updateDocument(ddocId: string, title?: string, content?: string): Promise<UpdateDocumentResponse> {
    const body: Record<string, string> = {};
    if (title !== undefined) body.title = title;
    if (content !== undefined) body.content = content;
    return this.request<UpdateDocumentResponse>(this.url(`/api/ddocs/${ddocId}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async deleteDocument(ddocId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(this.url(`/api/ddocs/${ddocId}`), {
      method: "DELETE",
    });
  }

  async searchDocuments(query: string, limit?: number, skip?: number): Promise<SearchResult> {
    const params: Record<string, string> = { q: query };
    if (limit !== undefined) params.limit = String(limit);
    if (skip !== undefined) params.skip = String(skip);
    return this.request<SearchResult>(this.url("/api/search", params));
  }

  async retryFailedEvents(): Promise<RetryFailedResponse> {
    return this.request<RetryFailedResponse>(this.url("/api/events/retry-failed"), {
      method: "POST",
    });
  }

  async pollUntilSynced(ddocId: string, timeoutMs = 60000, intervalMs = 3000): Promise<DocumentResult> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const doc = await this.getDocument(ddocId);
      if (doc.syncStatus === "synced" || doc.syncStatus === "failed") {
        return doc;
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    return this.getDocument(ddocId);
  }
}
