# Satellite API Reference

This document describes the Documents API exposed by the Satellite server and how to use it.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
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

| Method   | Path | Description |
| -------- | ---- | ----------- |
| `POST`   | `/api/ddocs` | Create a new document |
| `GET`    | `/api/ddocs` | List documents (paginated) |
| `GET`    | `/api/ddocs/:ddocId` | Get a document by `ddocId` |
| `PUT`    | `/api/ddocs/:ddocId` | Update a document |
| `DELETE` | `/api/ddocs/:ddocId` | Delete a document |

Create and update support both JSON and multipart/form-data (file upload). File uploads are limited to 10 MB.

## Authentication

All document API requests must be authenticated using an **API key**.

You can generate API keys from the **Developer mode** section of the settings modal in your ddoc account. For full details, follow our step-by-step guide [here](#).

Include your API key with each request. If the key is missing or invalid, the server responds with **401 Unauthorized** and body `{ "message": "Invalid or missing API key" }`.

## Request & Response Format

### Success responses

- **List documents** (`GET /api/ddocs`) returns a **plain JSON object** (no wrapper): `{ "ddocs": [...], "total": 42, "hasNext": true }`.
- **Get document** (`GET /api/ddocs/:ddocId`) returns the **document object directly**.
- **Create / Update / Delete** return a wrapper:
  - **Create:** `201` with `{ "message": "...", "data": { ... } }`
  - **Update / Delete:** `200` with `{ "message": "...", "data": { ... } }`

### Error responses

Errors use a single field:

```json
{
  "error": "Description of what went wrong"
}
```

HTTP status codes (e.g. 400, 401, 404, 409) indicate the error type.

---

## Endpoints

### Create document

Creates a new document. It is stored locally and queued for on-chain publishing (async).

**Request**

- **Method:** `POST`
- **Path:** `/api/ddocs`

**Body** (choose one):

1. **JSON**

   ```json
   {
     "title": "My document",
     "content": "Full text or markdown content."
   }
   ```

2. **Multipart form (file upload)**

   - Field name: `file`
   - Any text file (e.g. `.md`, `.txt`)
   - Title is derived from the filename (without extension); content is the file body.

**Validation**

- `title` — required (when using JSON; with file upload it comes from the filename).
- `content` — required: either provide a `content` field or upload a non-empty file.

**Response:** `201 Created`

```json
{
  "message": "File created successfully. Sync to on-chain is pending.",
  "data": {
    "_id": "01936b2e-...",
    "ddocId": "abc123short",
    "link": null,
    "title": "My document",
    "content": "Full text or markdown content.",
    "localVersion": 1,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 0,
    "onChainFileId": null,
    "portalAddress": "0x...",
    "createdAt": "2025-02-01T12:00:00.000Z",
    "updatedAt": "2025-02-01T12:00:00.000Z"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Missing `title` or content; invalid API key; or other validation error |

---

### List documents

Returns a paginated list of documents for the portal associated with the API key.

**Request**

- **Method:** `GET`
- **Path:** `/api/ddocs`

| Parameter | Type   | Default | Description |
| --------- | ------ | ------- | ----------- |
| `skip`    | number | —       | Number of documents to skip (offset). |
| `limit`   | number | `10`    | Maximum number of documents to return. |

**Response:** `200 OK` (plain JSON, no wrapper)

```json
{
  "ddocs": [
    {
      "ddocId": "abc123short",
      "link": null,
      "title": "My document",
      "content": "...",
      "localVersion": 1,
      "onchainVersion": 0,
      "syncStatus": "pending",
      "isDeleted": 0,
      "onChainFileId": null,
      "portalAddress": "0x...",
      "createdAt": "2025-02-01T12:00:00.000Z",
      "updatedAt": "2025-02-01T12:00:00.000Z"
    }
  ],
  "total": 42,
  "hasNext": true
}
```

---

### Get document

Returns a single document by its public `ddocId`.

**Request**

- **Method:** `GET`
- **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description |
| ---------- | ------ | ----------- |
| `ddocId`   | string | Short public identifier of the document. |

**Response:** `200 OK` (document object directly)

```json
{
  "ddocId": "abc123short",
  "link": null,
  "title": "My document",
  "content": "Full text or markdown content.",
  "localVersion": 1,
  "onchainVersion": 0,
  "syncStatus": "pending",
  "isDeleted": 0,
  "onChainFileId": null,
  "portalAddress": "0x...",
  "createdAt": "2025-02-01T12:00:00.000Z",
  "updatedAt": "2025-02-01T12:00:00.000Z"
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Missing `ddocId` |
| 404 | No document found for the given `ddocId` (`{ "error": "DDoc not found" }`) |

---

### Update document

Updates an existing document by `ddocId`. Supports partial updates (send only the fields that change).

**Request**

- **Method:** `PUT`
- **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description |
| ---------- | ------ | ----------- |
| `ddocId`   | string | Short public identifier of the document. |

**Body** (choose one):

1. **JSON**

   ```json
   {
     "title": "Updated title",
     "content": "Updated content. Omit either field to leave it unchanged."
   }
   ```

2. **Multipart form (file upload)** — field name `file`; title from filename, content from file body.

**Validation**

- At least one of `title` or `content` (or file) must be provided.

**Response:** `200 OK`

```json
{
  "message": "File updated successfully",
  "data": {
    "ddocId": "abc123short",
    "link": null,
    "title": "Updated title",
    "content": "Updated content.",
    "localVersion": 2,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 0,
    "onChainFileId": null,
    "portalAddress": "0x..."
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Neither title nor content provided; invalid API key; or other validation error |
| 404 | No document found for the given `ddocId` |

---

### Delete document

Soft-deletes a document. It is removed from normal list/get; a background job is queued for on-chain sync.

**Request**

- **Method:** `DELETE`
- **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description |
| ---------- | ------ | ----------- |
| `ddocId`   | string | Short public identifier of the document. |

**Response:** `200 OK`

```json
{
  "message": "File deleted successfully",
  "data": {
    "ddocId": "abc123short",
    "title": "My document",
    "content": "...",
    "localVersion": 1,
    "onchainVersion": 0,
    "syncStatus": "pending",
    "isDeleted": 1,
    "onChainFileId": null,
    "portalAddress": "0x...",
    "createdAt": "2025-02-01T12:00:00.000Z",
    "updatedAt": "2025-02-01T12:05:00.000Z"
  }
}
```

**Errors**

| Status | Condition |
|--------|-----------|
| 400 | Missing `ddocId` or invalid API key |
| 404 | No document found for the given `ddocId` |

---

## Data Models

### Document (ddoc)

| Field            | Type   | Description |
| ---------------- | ------ | ----------- |
| `_id`            | string | Internal UUID (e.g. UUIDv7); present in create/delete responses, may be omitted in list/get. |
| `ddocId`         | string | Short public ID used in URLs and by clients. |
| `link`           | string \| null | Link to the document when available. |
| `title`          | string | Document title. |
| `content`        | string | Full document body (e.g. markdown or plain text). |
| `localVersion`   | number | Increments on each update. |
| `onchainVersion` | number | Version reflected on-chain (may lag). |
| `syncStatus`     | string | e.g. `pending`, `synced`, `failed`. |
| `isDeleted`      | number | `0` = active, non-zero = soft-deleted. |
| `onChainFileId`  | number \| null | On-chain file ID when synced. |
| `portalAddress`  | string | Portal address. |
| `createdAt`      | string | ISO 8601 timestamp. |
| `updatedAt`      | string | ISO 8601 timestamp. |

### List result (ddocs)

| Field   | Type     | Description |
| ------- | -------- | ----------- |
| `ddocs` | object[] | Array of document objects. |
| `total` | number   | Total count of documents. |
| `hasNext` | boolean | Whether more pages exist. |

---

## Current scope and roadmap

This section summarizes where Satellite fits today and what might change later.

### Where Satellite fits today

| What you get | How it helps |
| ------------ | ------------ |
| REST API for documents | Create, list, get, update, and delete documents over HTTP for use by LLMs, agents, tools, MCP servers, or custom scripts. |
| Persistent docs | Documents are stored and can be synced on-chain as a stable source of truth. |
| Self-hosted | You run the Satellite server; docs and traffic stay on your infrastructure. |
| API-first | No built-in UI; the primary interface is the API. |
| Title + content | Each document has a title and body (e.g. markdown), suited for notes or verifiable reference. |

### What this API does not provide (yet)

| Expectation | Status |
| ----------- | ------ |
| Built-in collaborative editor | Not included. Editing is supported via the CLI (e.g. open in your editor). |
| MCP server or official CLI for Cursor/agents | Under consideration. |
| Zero config | Some setup is required (server and environment configuration). |

### Future possibilities

- MCP server so Cursor and other agents can discover and use Satellite without writing HTTP calls.
- CLI / skills for terminal-based agents.
- Simpler auth for users and agents.
- Real-time or subscribe for collaborative editing or live updates.
- Verifiable context with documents synced on-chain.
- First-party or community editor built on this API.
