# Satellite MCP Integration

Satellite exposes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that lets AI agents manage documents, search content, and monitor blockchain sync — all through native tool calls.

Two transport modes are available:

| Mode | Transport | Use case |
|------|-----------|----------|
| **CLI (stdio)** | Standard I/O | Satellite runs locally on your machine |
| **Server (HTTP)** | Streamable HTTP | Satellite is deployed remotely (Heroku, VPS, etc.) |

Both modes expose the same tools. Choose based on where your Satellite instance runs.

---

## Prerequisites

Install the package globally (required for stdio mode, optional for HTTP mode):

```bash
npm install -g @fileverse/satellite
```

Make sure Satellite is running:

```bash
# Start the server (also writes ~/.satellite/.env with your API key)
npx @fileverse/satellite --apiKey <your-api-key> --rpcUrl <your-rpc-url>
```

---

## Mode 1: CLI (stdio transport)

Use this when Satellite runs on the **same machine** as your AI tool. The MCP client spawns the `satellite-mcp` binary as a subprocess and communicates over stdin/stdout.

The stdio server reads credentials automatically from:
1. Environment variables (`SATELLITE_API_KEY`, `SATELLITE_SERVER_URL`)
2. `config/.env` in the current working directory
3. `~/.satellite/.env` (written by the CLI on first run)
4. `~/.satelliterc`

### Claude Code

```bash
claude mcp add satellite -- satellite-mcp
```

Or with explicit environment variables:

```bash
claude mcp add satellite \
  -e SATELLITE_API_KEY=your-api-key \
  -e SATELLITE_SERVER_URL=http://localhost:8001 \
  -- satellite-mcp
```

To verify it was added:

```bash
claude mcp list
```

### Claude Desktop

Edit your Claude Desktop config file:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "satellite": {
      "command": "satellite-mcp",
      "env": {
        "SATELLITE_API_KEY": "your-api-key",
        "SATELLITE_SERVER_URL": "http://localhost:8001"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

### Cursor

Open **Settings > MCP** and add a new server:

```json
{
  "mcpServers": {
    "satellite": {
      "command": "satellite-mcp",
      "env": {
        "SATELLITE_API_KEY": "your-api-key",
        "SATELLITE_SERVER_URL": "http://localhost:8001"
      }
    }
  }
}
```

### Windsurf

Open **Settings > MCP** and add:

```json
{
  "mcpServers": {
    "satellite": {
      "command": "satellite-mcp",
      "env": {
        "SATELLITE_API_KEY": "your-api-key",
        "SATELLITE_SERVER_URL": "http://localhost:8001"
      }
    }
  }
}
```

---

## Mode 2: Server (HTTP transport)

Use this when Satellite is deployed **remotely** and agents cannot spawn local processes. The MCP server is available at `POST /mcp` on the same Express app that serves the REST API.

HTTP mode is enabled automatically when the Satellite server starts — no additional configuration needed. The MCP endpoint uses stateless Streamable HTTP transport, so each request is independent (no sessions).

### Claude Code

```bash
claude mcp add satellite --transport http https://your-satellite-server.com/mcp
```

For a local dev server:

```bash
claude mcp add satellite --transport http http://localhost:8001/mcp
```

To verify:

```bash
claude mcp list
```

### Claude Desktop

```json
{
  "mcpServers": {
    "satellite": {
      "type": "streamable-http",
      "url": "https://your-satellite-server.com/mcp"
    }
  }
}
```

### Cursor

Open **Settings > MCP** and add a new server with type **streamable-http**:

```json
{
  "mcpServers": {
    "satellite": {
      "type": "streamable-http",
      "url": "https://your-satellite-server.com/mcp"
    }
  }
}
```

### Windsurf

```json
{
  "mcpServers": {
    "satellite": {
      "type": "streamable-http",
      "url": "https://your-satellite-server.com/mcp"
    }
  }
}
```

---

## Available Tools

Once connected (in either mode), the following tools are available to the AI agent:

| Tool | Description |
|------|-------------|
| `satellite_list_documents` | List documents with optional `limit` and `skip` for pagination |
| `satellite_get_document` | Get a single document by `ddocId` |
| `satellite_create_document` | Create a document (title + content) and wait for blockchain sync |
| `satellite_update_document` | Update a document and wait for blockchain sync |
| `satellite_delete_document` | Delete a document by `ddocId` |
| `satellite_search_documents` | Search documents by text query |
| `satellite_get_sync_status` | Check sync status and blockchain link of a document |
| `satellite_retry_failed_events` | Retry all failed blockchain sync events |

Create and update tools **automatically poll** until blockchain sync completes, so agents don't need to implement polling logic.

---

## Usage Examples

### List all documents

**Tool:** `satellite_list_documents`
**Input:**
```json
{ "limit": 10, "skip": 0 }
```
**Response:**
```json
{
  "ddocs": [
    {
      "ddocId": "abc123",
      "title": "Meeting Notes",
      "syncStatus": "synced",
      "link": "https://portal.fileverse.io/...",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "total": 42,
  "hasNext": true
}
```

### Create a document

**Tool:** `satellite_create_document`
**Input:**
```json
{
  "title": "Project Roadmap",
  "content": "# Q1 Goals\n\n- Launch MCP integration\n- Add batch operations\n- Improve sync reliability"
}
```
**Response** (returned after sync completes):
```json
{
  "ddocId": "def456",
  "title": "Project Roadmap",
  "content": "# Q1 Goals\n\n- Launch MCP integration\n...",
  "syncStatus": "synced",
  "link": "https://portal.fileverse.io/...",
  "localVersion": 1,
  "onchainVersion": 1
}
```

### Search documents

**Tool:** `satellite_search_documents`
**Input:**
```json
{ "query": "roadmap", "limit": 5 }
```
**Response:**
```json
{
  "nodes": [
    {
      "ddocId": "def456",
      "title": "Project Roadmap",
      "syncStatus": "synced",
      "link": "https://portal.fileverse.io/..."
    }
  ],
  "total": 1,
  "hasNext": false
}
```

### Update a document

**Tool:** `satellite_update_document`
**Input:**
```json
{
  "ddocId": "def456",
  "content": "# Q1 Goals (Updated)\n\n- ~~Launch MCP integration~~ Done!\n- Add batch operations\n- Improve sync reliability"
}
```

### Check sync status

**Tool:** `satellite_get_sync_status`
**Input:**
```json
{ "ddocId": "def456" }
```
**Response:**
```json
{
  "ddocId": "def456",
  "syncStatus": "synced",
  "link": "https://portal.fileverse.io/...",
  "localVersion": 2,
  "onchainVersion": 2
}
```

---

## Choosing Between Modes

| Consideration | stdio (CLI) | HTTP (Server) |
|---------------|-------------|---------------|
| Satellite runs locally | Yes | Yes (via localhost) |
| Satellite runs remotely | No | Yes |
| Requires `satellite-mcp` installed | Yes | No |
| Authentication | API key via env/config files | API key is server-side |
| Latency | Lower (direct subprocess) | Slightly higher (HTTP) |
| Session management | Persistent process | Stateless per-request |

**Rule of thumb:** Use stdio when running Satellite on your own machine. Use HTTP when connecting to a deployed Satellite instance.

---

## Troubleshooting

### stdio mode: "No API key configured"

The `satellite-mcp` binary couldn't find an API key. Fix by either:
- Setting the environment variable: `SATELLITE_API_KEY=your-key`
- Running `npx @fileverse/satellite` once (writes credentials to `~/.satellite/.env`)
- Creating `~/.satelliterc` with `{"apiKey": "your-key", "serverUrl": "http://localhost:8001"}`

### stdio mode: Tools return connection errors

The Satellite server isn't running. Start it:
```bash
npx @fileverse/satellite --apiKey <key> --rpcUrl <url>
```

### HTTP mode: POST /mcp returns 404

The MCP endpoint is only available when the full Satellite server is running (via `npm run dev` or `node dist/index.js`). Verify the server is up:
```bash
curl http://localhost:8001/ping
# Expected: {"reply":"pong"}
```

### HTTP mode: GET /mcp returns 405

This is expected. The MCP HTTP transport only accepts `POST` requests. `GET` and `DELETE` return 405 because stateless mode does not use SSE streams or sessions.

### MCP tools not appearing in your AI client

1. Verify the server is registered: check your client's MCP settings
2. For stdio: ensure `satellite-mcp` is in your PATH (`which satellite-mcp`)
3. For HTTP: confirm the URL is reachable (`curl -X POST http://your-server/mcp`)
4. Restart your AI client after configuration changes
