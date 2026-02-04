# Ddocs API Reference

The Ddocs API manages decentralized documents (ddocs) — files stored and synced.

Base path: `/api/ddocs`

---

## Table of Contents

- [Overview](#overview)
- [Request & Response Format](#request--response-format)
- [Endpoints](#endpoints)
  - [Create document](#create-document)
  - [List documents](#list-documents)
  - [Get document](#get-document)
  - [Update document](#update-document)
  - [Delete document](#delete-document)
- [Data Models](#data-models)
- [Current scope and roadmap](#current-scope-and-roadmap)

---

## Overview

| Method   | Path        | Description        |
| -------- | ----------- | ------------------ |
| `POST`   | `/api/ddocs`       | Create a new document |
| `GET`    | `/api/ddocs`       | List documents (paginated) |
| `GET`    | `/api/ddocs/:ddocId` | Get a single document by `ddocId` |
| `PUT`    | `/api/ddocs/:ddocId` | Update a document |
| `DELETE` | `/api/ddocs/:ddocId` | Delete a document |

Create and update support both JSON and multipart/form-data (file upload). File uploads are limited to 10 MB.

---

## Request & Response Format

### Success response

All successful responses use this shape:

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": { ... }
}
```

- `statusCode` — HTTP status code
- `message` — Human-readable message
- `data` — Response payload (omitted for delete)

### Error response

Errors return:

```json
{
  "statusCode": 400,
  "errorMsg": "Description of what went wrong",
  "error": "Optional technical detail"
}
```

---

## Endpoints

### Create document

Creates a new document. On success it is stored locally and queued for on-chain publishing (async).

Request

- Method: `POST`
- Path: `/api/ddocs`

Body (choose one):

1. JSON

   ```json
   {
     "title": "My document",
     "content": "Full text or markdown content."
   }
   ```

2. Multipart form (file upload)

   - Field name: `file`
   - File: any text file (e.g. `.md`, `.txt`)
   - Title is derived from the filename (without extension). Content is the file body.

Validation

- `title` — required, non-empty
- `content` — required, non-empty (or non-empty file)

Response: `201 Created`

```json
{
  "statusCode": 201,
  "message": "File created successfully. On-chain publishing is pending.",
  "data": {
    "id": "01936b2e-...",
    "ddocId": "abc123short",
    "title": "My document",
    "content": "Full text or markdown content.",
    "localVersion": 1,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 0,
    "createdAt": "2025-02-01T12:00:00.000Z",
    "updatedAt": "2025-02-01T12:00:00.000Z"
  }
}
```

Errors

| Status | Condition |
|--------|-----------|
| 400    | Missing `title` or empty content |

---

### List documents

Returns a paginated list of documents.

Request

- Method: `GET`
- Path: `/api/ddocs`

Query parameters

| Parameter | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| `skip`    | number | `0`     | Number of documents to skip (offset). |
| `limit`   | number | `20`    | Maximum number of documents to return. |

Response: `200 OK`

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "files": [
      {
        "id": "01936b2e-...",
        "ddocId": "abc123short",
        "title": "My document",
        "content": "...",
        "localVersion": 1,
        "onchainVersion": 0,
        "syncStatus": "pending",
        "isDeleted": 0,
        "createdAt": "2025-02-01T12:00:00.000Z",
        "updatedAt": "2025-02-01T12:00:00.000Z"
      }
    ],
    "total": 42,
    "hasNext": true
  }
}
```

Errors

| Status | Condition |
|--------|-----------|
---

### Get document

Returns a single document by its public `ddocId`.

Request

- Method: `GET`
- Path: `/api/ddocs/:ddocId`

Path parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `ddocId`  | string | Short public identifier of the document (e.g. from create/list). |

Response: `200 OK`

```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "01936b2e-...",
    "ddocId": "abc123short",
    "title": "My document",
    "content": "Full text or markdown content.",
    "localVersion": 1,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 0,
    "createdAt": "2025-02-01T12:00:00.000Z",
    "updatedAt": "2025-02-01T12:00:00.000Z"
  }
}
```

Errors

| Status | Condition |
|--------|-----------|
| 400    | Missing `ddocId` |
| 404    | No document found for the given `ddocId` |

---

### Update document

Updates an existing document by `ddocId`. Supports partial updates (only send fields that change).

Request

- Method: `PUT`
- Path: `/api/ddocs/:ddocId`

Path parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `ddocId`  | string | Short public identifier of the document. |

Body (choose one):

1. JSON

   ```json
   {
     "title": "Updated title",
     "content": "Updated content. Omit either field to leave it unchanged."
   }
   ```

2. Multipart form (file upload)

   - Field name: `file`
   - Title from filename (without extension); content from file body. Same as create.

Validation

- `title` — if provided, must not be an empty or whitespace-only string.

Response: `200 OK`

```json
{
  "statusCode": 200,
  "message": "File updated successfully",
  "data": {
    "id": "01936b2e-...",
    "ddocId": "abc123short",
    "title": "Updated title",
    "content": "Updated content.",
    "localVersion": 2,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 0,
    "createdAt": "2025-02-01T12:00:00.000Z",
    "updatedAt": "2025-02-01T12:05:00.000Z"
  }
}
```

Errors

| Status | Condition |
|--------|-----------|
| 400    | Empty `title` when provided |
| 404    | No document found for the given `ddocId` |

---

### Delete document

Soft-deletes a document. The document is removed from normal listing and get; a background job is queued for on-chain sync.

Request

- Method: `DELETE`
- Path: `/api/ddocs/:ddocId`

Path parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `ddocId`  | string | Short public identifier of the document. |

Response: `200 OK`

```json
{
  "statusCode": 200,
  "message": "File deleted successfully"
}
```

No `data` field is returned.

Errors

| Status | Condition |
|--------|-----------|
| 400    | Missing `ddocId` |
| 404    | No document found for the given `ddocId` |

---

## Data Models

### Document (File entity)

| Field           | Type   | Description |
| --------------- | ------ | ----------- |
| `id`            | string | Internal UUID (e.g. UUIDv7). |
| `ddocId`        | string | Short public ID used in URLs and by clients. |
| `title`         | string | Document title. |
| `content`       | string | Full document body (e.g. markdown or plain text). |
| `localVersion`  | number | Increments on each update. |
| `onchainVersion` | number | Version reflected on-chain (may lag). |
| `syncStatus`    | string | e.g. `pending`; indicates sync state. |
| `isDeleted`     | number | `0` = active, non-zero = soft-deleted. |
| `createdAt`     | string | ISO 8601 timestamp. |
| `updatedAt`     | string | ISO 8601 timestamp. |

### List result

| Field   | Type     | Description |
| ------- | -------- | ----------- |
| `files` | object[] | Array of document objects. |
| `total` | number   | Total count of documents. |
| `hasNext` | boolean | Whether more pages exist after this one. |

---

## Current scope and roadmap

This section helps you see where Satellite fits in your workflow — what this package supports today, what it does not, and what might come later. Use it to decide how (and whether) to plug Satellite into your agents, editors, or tools.

### Where Satellite fits today

| What you get | How it helps |
| ------------ | ------------ |
| REST API for documents | Any LLM, agent, or tool (Claude Code, Cursor, ChatGPT, GLM, custom scripts, MCP servers you build, etc.) can create, list, get, update, and delete documents over HTTP. No vendor lock-in. |
| Persistent docs | Documents are stored and listed. Agents can treat them as a stable source of truth — e.g. "go-to" markdown files that persist across sessions so the LLM knows what exists when it comes back. |
| Self-hosted | You run the Satellite server yourself. Your docs and traffic stay on your infrastructure; you control privacy and data. |
| API-first | No built-in UI. You (or the community) can build editors, MCP servers, CLIs, or integrations on top of this API. "Having access via API" is the primary interface. |
| Title + content (e.g. markdown) | Each doc has a title and body. Ideal for markdown as agent context, notes, or verifiable reference — with on-chain sync planned for later. |

In short: If your expectation is *"agents should be able to make their own docs and keep a list so sessions don't mean the LLM has no idea what you're talking about"* — that is what this API supports. Agents (or your code) call the API to create/list/get/update/delete docs; you host the server; you build or plug in the rest (editor, MCP, CLI, etc.).

### What this API does not provide (yet)

| Expectation | Status |
| ----------- | ------ |
| Built-in markdown editor (e.g. "simple dumb but beautiful", user + agent multiplayer in one UI) | Not in this package. This is an API only. You can build or use a separate editor that talks to this API. |
| Real-time subscribe / multiplayer (live presence, typing, subscriptions) | Not in this API. Updates are request/response. Real-time could be a future layer. |
| Auth (e.g. "run an auth script or give a browser link", "avoid config") | Not covered in this doc. Auth may live in another layer or product; this doc describes the ddocs API only. |
| MCP server or official CLI for Cursor/agents | Not part of this API doc. The repo may include a CLI (`ddctl`); MCP or first-party CLI tooling may be added later. |
| Zero config | Not guaranteed. You need to run the server. We keep the surface small but some config is required. |
| Verifiable / on-chain context | Planned. Documents are queued for on-chain sync ("on-chain publishing is pending"); full verifiable context is a future capability. |

If your main expectation is a ready-made, beautiful, multiplayer markdown editor out of the box — that is not what this API delivers today. It delivers the backend so you or others can build that on top.

### Future possibilities

These are not promises, but directions that align with feedback and could be supported later:

- MCP server so Cursor and other agents can discover and use Satellite without you writing HTTP calls.
- CLI / skills for terminal-based agents (e.g. "prefer CLI/skills instead of MCP").
- Auth that's simple for users and agents (e.g. script or browser link, minimal config).
- Real-time / subscribe for collaborative editing or live updates.
- Verifiable context — documents synced on-chain so agents can rely on "verifiable" markdown as source of truth.
- First-party or community editor — a "sexy Fileverse md" or similar that uses this API.

Keeping these three buckets clear (supported now / not yet / future) should help you quickly see where you can incorporate Satellite and where to look for or build alternatives.

---

*Generated from the Satellite ddocs API. Base URL may vary by deployment; replace `localhost:3000` with your API host.*
