# Ddocs API Reference

In this section we you find all the API endpoints exposed by the satellite

In this section you will find all the API endpoints of the Satellite package and the details around them.

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

## Overview

| Method   | Path        | Description        |
| -------- | ----------- | ------------------ |
| `POST`   | `/api/ddocs`       | Create a new document |
| `GET`    | `/api/ddocs`       | List documents (paginated) |
| `GET`    | `/api/ddocs/:ddocId` | Get a single document by `ddocId` |
| `PUT`    | `/api/ddocs/:ddocId` | Update a document |
| `DELETE` | `/api/ddocs/:ddocId` | Delete a document |

Create and update support both JSON and multipart/form-data (file upload). File uploads are limited to 10 MB.

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


## Current scope and roadmap

This section helps you see where Satellite fits in your workflow — what this package supports today, what it does not, and what might come later. Use it to decide how (and whether) to plug Satellite into your agents, editors, or tools.

### Where Satellite fits today

| What you get | How it helps |
| ------------ | ------------ |
| REST API for documents | A full REST API lets any LLM, agent, or tool (Claude Code, Cursor, ChatGPT, custom scripts, MCP servers) create, list, get, update, and delete documents over HTTP—with no vendor lock-in. |
| Persistent docs | Documents are stored on-chain. Agents can treat them as a stable source of truth |
| Self-hosted | You run the Satellite server. Your docs and traffic stay on your infrastructure; you control privacy and data. |
| API-first | There is no built-in UI. You or the community build editors, MCP servers, CLIs, or integrations on top of this API; the primary interface is the API itself. |
| Title + content (e.g. markdown) | Each document has a title and body. Suited for markdown as agent context, notes, or verifiable reference; on-chain sync is planned for later. |

### What this API does not provide (yet)

| Expectation | Status |
| ----------- | ------ |
| Built-in collaborative editor (user and agent in one UI, live presence, typing) | Not included. Editing is supported via the CLI (e.g. open in your editor); a ready-made shared editor is not on the current roadmap. |
| MCP server or official CLI for Cursor/agents | Under consideration; may be offered in a future release. |
| Zero config | Some setup is required (e.g. running the server and configuring the environment). Zero-config usage is not supported today. |

### Future possibilities

These are not promises, but directions we can consider moving forward depending on user feedback.

- MCP server so Cursor and other agents can discover and use Satellite without you writing HTTP calls.
- CLI / skills for terminal-based agents (e.g. "prefer CLI/skills instead of MCP").
- Auth that's simple for users and agents (e.g. script or browser link, minimal config).
- Real-time / subscribe for collaborative editing or live updates.
- Verifiable context — documents synced on-chain so agents can rely on "verifiable" markdown as source of truth.
- First-party or community editor — a "sexy Fileverse md" or similar that uses this API.



