---
name: fileverse-api
description: Create, manage, and publish documents to blockchain using Fileverse API. Supports MCP tools for seamless AI agent integration with automatic blockchain sync.
---

# Fileverse API

Manage and publish documents to blockchain storage via Fileverse API. Connects through MCP for native tool access with automatic blockchain sync polling.

## Setup

### 1. Get credentials

You need a **Fileverse API key** and a running **Fileverse API server**.

Install and start the server:

```bash
npm install -g @fileverse/api
npx @fileverse/api --apiKey <your-api-key> --rpcUrl <your-rpc-url>
```

The server runs at `http://localhost:8001` by default.

### 2. Add the MCP connector

Add the Fileverse MCP server to your AI tool config. Replace `YOUR_SERVER_URL` and `YOUR_API_KEY` with your values.

#### Claude Code

```bash
claude mcp add fileverse-api -- npx -y @anthropic-ai/mcp-proxy@latest --endpoint "YOUR_SERVER_URL/mcp" --header "x-api-key: YOUR_API_KEY"
```

#### Cursor / Windsurf / Other MCP clients

Add to your MCP config (e.g., `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "fileverse-api": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-proxy@latest", "--endpoint", "YOUR_SERVER_URL/mcp", "--header", "x-api-key: YOUR_API_KEY"]
    }
  }
}
```

### 3. Restart your AI tool

After adding the config, restart or reload. You will have access to the tools listed below.

## Available Tools

| Tool | Description |
|------|-------------|
| `fileverse_list_documents` | List documents with pagination |
| `fileverse_get_document` | Get a single document by ddocId |
| `fileverse_create_document` | Create document and wait for blockchain sync (returns link) |
| `fileverse_update_document` | Update document and wait for blockchain sync (returns link) |
| `fileverse_delete_document` | Delete a document |
| `fileverse_search_documents` | Search documents by text query |
| `fileverse_get_sync_status` | Check sync status and blockchain link of a document |
| `fileverse_retry_failed_events` | Retry all failed blockchain sync events |

Create and update tools automatically poll until blockchain sync completes. Once synced, the response includes a public `link` to the document.

## Usage Examples

### Publish a local file

```
Read the file at path/to/document.md, then use fileverse_create_document
with the filename as the title and file contents as content.
```

### Search and update a document

```
Use fileverse_search_documents with query "meeting notes",
then fileverse_update_document with the ddocId and new content.
```

### Check sync status

```
Use fileverse_get_sync_status with a ddocId to see if
the document has been published to blockchain.
```

## Key Concepts

- **DDoc**: A document with a unique `ddocId`
- **syncStatus**: `pending` (syncing to blockchain) -> `synced` (published, `link` available) or `failed`
- **link**: Public URL to view the document on-chain (only present when synced)

## Slash Commands

After installing, you can set up slash commands for quick access. Fetch `{SERVER_URL}/skill.md` for ready-to-use command definitions:

| Command | Purpose |
|---------|---------|
| `/fileverse-publish <path>` | Publish a local file to blockchain |
| `/fileverse-list` | List all documents |
| `/fileverse-search <query>` | Search documents by text |
| `/fileverse-status <ddocId>` | Check sync status |
| `/fileverse-delete <ddocId>` | Delete a document |

## Full Documentation

For the complete API reference, REST API fallback, CLI mode, and response schemas, fetch `{SERVER_URL}/llm.txt`.
