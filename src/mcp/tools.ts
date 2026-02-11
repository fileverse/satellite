import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SatelliteClient } from "./client.js";

export function registerTools(server: McpServer, client: SatelliteClient): void {
  server.tool(
    "satellite_list_documents",
    "List documents stored in Satellite. Returns an array of documents with their metadata and sync status.",
    {
      limit: z.number().optional().describe("Maximum number of documents to return"),
      skip: z.number().optional().describe("Number of documents to skip (for pagination)"),
    },
    async ({ limit, skip }) => {
      const result = await client.listDocuments(limit, skip);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_get_document",
    "Get a single document by its ddocId. Returns the full document including content, sync status, and blockchain link.",
    {
      ddocId: z.string().describe("The unique document identifier"),
    },
    async ({ ddocId }) => {
      const result = await client.getDocument(ddocId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_create_document",
    "Create a new document and wait for blockchain sync. Returns the document with its sync status and public link once synced.",
    {
      title: z.string().describe("Document title"),
      content: z.string().describe("Document content (plain text or markdown)"),
    },
    async ({ title, content }) => {
      const created = await client.createDocument(title, content);
      const ddocId = created.data.ddocId;
      const final = await client.pollUntilSynced(ddocId);
      return {
        content: [{ type: "text", text: JSON.stringify(final, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_update_document",
    "Update an existing document's title and/or content, then wait for blockchain sync. Returns the updated document with sync status and link.",
    {
      ddocId: z.string().describe("The unique document identifier"),
      title: z.string().optional().describe("New document title"),
      content: z.string().optional().describe("New document content"),
    },
    async ({ ddocId, title, content }) => {
      await client.updateDocument(ddocId, title, content);
      const final = await client.pollUntilSynced(ddocId);
      return {
        content: [{ type: "text", text: JSON.stringify(final, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_delete_document",
    "Delete a document by its ddocId.",
    {
      ddocId: z.string().describe("The unique document identifier to delete"),
    },
    async ({ ddocId }) => {
      const result = await client.deleteDocument(ddocId);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_search_documents",
    "Search documents by text query. Returns matching documents ranked by relevance.",
    {
      query: z.string().describe("Search query string"),
      limit: z.number().optional().describe("Maximum number of results"),
      skip: z.number().optional().describe("Number of results to skip"),
    },
    async ({ query, limit, skip }) => {
      const result = await client.searchDocuments(query, limit, skip);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_get_sync_status",
    "Check the sync status of a document. Returns the current syncStatus and blockchain link if synced.",
    {
      ddocId: z.string().describe("The unique document identifier"),
    },
    async ({ ddocId }) => {
      const doc = await client.getDocument(ddocId);
      const result = {
        ddocId: doc.ddocId,
        syncStatus: doc.syncStatus,
        link: doc.link,
        localVersion: doc.localVersion,
        onchainVersion: doc.onchainVersion,
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.tool(
    "satellite_retry_failed_events",
    "Retry all failed blockchain sync events. Use this when documents are stuck in 'failed' sync status.",
    {},
    async () => {
      const result = await client.retryFailedEvents();
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
