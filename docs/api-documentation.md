---
title: Satellite API Reference
date: 2026-02-09
---

# Satellite API Reference

This document explains the Documents API exposed by the Satellite server and provides guidance on how to use it.

## Table of Contents

* [Overview](#overview)
* [Authentication](#authentication)
* [Request & Response Format](#request--response-format)
* [Endpoints](#endpoints)
    
    * [Create document](#create-document)
    * [List documents](#list-documents)
    * [Get document](#get-document)
    * [Update document](#update-document)
    * [Delete document](#delete-document)
* [Data Models](#data-models)
* [Current scope and roadmap](#current-scope-and-roadmap)

* * *

## Overview

| Method   | Path                 | Description                |
| -------- | -------------------- | -------------------------- |
| `POST`   | `/api/ddocs`         | Create a new document      |
| `GET`    | `/api/ddocs`         | List documents (paginated) |
| `GET`    | `/api/ddocs/:ddocId` | Get a document by `ddocId` |
| `PUT`    | `/api/ddocs/:ddocId` | Update a document          |
| `DELETE` | `/api/ddocs/:ddocId` | Delete a document          |

Create and update support both JSON and multipart/form-data (file upload). File uploads are limited to 10 MB.

* * *

## Authentication

All document API requests must be authenticated using an **API key**.

You can generate API keys from the **Developer mode** section of the settings modal in your ddoc account. For full details, follow our step-by-step guide [here](#).

When you start the Satellite server, you’ll be prompted to enter the API key you generated, along with few other variables. Once provided, this key will be used automatically to authenticate all subsequent API requests.

* * *

## Endpoints

### Create document

Creates a new document. It is stored locally and queued for on-chain publishing (async).

**Request**

* **Method:** `POST`
* **Path:** `/api/ddocs`

**Body** (choose one):

1. **JSON**
    
    ```plaintext
    {
        "title": "API reference",
        "content": "Here are the APIs satellite offers"
    }
    ```
2. **Multipart form (file upload)**
    
    * Field name: `file`
    * Any text file (e.g. `.md`, `.txt`)
    * Title is derived from the filename (without extension); content is the file body.

**Validation**

* `title` — required (when using JSON; with file upload it comes from the filename).
* `content` — required: either provide a `content` string or upload a non-empty file.

**Response:** `201 Created`

```plaintext
{
    "message": "File created successfully. Sync to on-chain is pending.",
    "data": {
        "_id": "019c3387-3b49-7d7d-8a63-d3eeb453f0d7",
        "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
        "title": "API reference",
        "content": "Here are the APIs satellite offers",
        "localVersion": 1,
        "onchainVersion": 0,
        "syncStatus": "pending",
        "isDeleted": 0,
        "onChainFileId": null,
        "portalAddress": "0x16e58D772704526349dF48D2a483d553de77aEf0",
        "metadata": {},
        "createdAt": "2026-02-06 15:17:06",
        "updatedAt": "2026-02-06 15:17:06",
        "linkKey": null,
        "linkKeyNonce": null,
        "commentKey": null,
        "link": null
    }
}
```

**Errors**

| Status | Condition                                                              |
| ------ | ---------------------------------------------------------------------- |
| 400    | Missing `title` or content; invalid API key; or other validation error |

* * *

### List documents

Returns a paginated list of documents for the portal associated with the API key.

**Request**

* **Method:** `GET`
* **Path:** `/api/ddocs`

| Parameter | Type   | Default | Description                            |
| --------- | ------ | ------- | -------------------------------------- |
| `skip`    | number | —       | Number of documents to skip (offset).  |
| `limit`   | number | `10`    | Maximum number of documents to return. |

**Response:** `200 OK` (plain JSON, no wrapper)

```plaintext
{
    "ddocs": [
        {
            "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
            "link": null,
            "title": "API reference",
            "content": "Here are the APIs satellite offers",
            "localVersion": 1,
            "onchainVersion": 0,
            "syncStatus": "pending",
            "isDeleted": 0,
            "onChainFileId": null,
            "portalAddress": "0x16e58D772704526349dF48D2a483d553de77aEf0",
            "createdAt": "2026-02-06 15:17:06",
            "updatedAt": "2026-02-06 15:17:06"
        }
    ],
    "total": 3,
    "hasNext": false
}
```

* * *

### Get document

Returns a single document by its public `ddocId`.

**Request**

* **Method:** `GET`
* **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description                              |
| ---------- | ------ | ---------------------------------------- |
| `ddocId`   | string | Short public identifier of the document. |

**Response:** `200 OK` (document object directly)

```plaintext
{
    "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
    "link": "https://v1-docs.fileverse.io/0x16e58D772704526349dF48D2a483d553de77aEf0/10#key=RyyOcsgsKoBqjwBcC9jrGSgT8HxILR9iW1BEa6SagzeMwUHzrfCtV7taSzjU3KJx",
    "title": "API reference",
    "content": "Here are the APIs satellite offers",
    "localVersion": 1,
    "onchainVersion": 1,
    "syncStatus": "synced",
    "isDeleted": 0,
    "onChainFileId": 10,
    "portalAddress": "0x16e58D772704526349dF48D2a483d553de77aEf0",
    "createdAt": "2026-02-06 15:17:06",
    "updatedAt": "2026-02-06T15:17:39.288Z"
}
```

**Errors**

| Status | Condition                                                                  |
| ------ | -------------------------------------------------------------------------- |
| 400    | Missing `ddocId`                                                           |
| 404    | No document found for the given `ddocId` (`{ "error": "DDoc not found" }`) |

* * *

### Update document

Updates an existing document by `ddocId`. Supports partial updates (send only the fields that change).

**Request**

* **Method:** `PUT`
* **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description                              |
| ---------- | ------ | ---------------------------------------- |
| `ddocId`   | string | Short public identifier of the document. |

**Body**:  
  
You may update the title, the content, or both, as needed. Omit any fields you do not wish to update. For example, if you only want to update the content, exclude the title from the request payload.

1. **JSON**
    
    ```plaintext
    {
        "content": "updated content"
    }
    ```
2. **Multipart form (file upload)** — field name `file`; title from filename, content from file body.

**Validation**

* At least one of `title` or `content` (or file) must be provided.

**Response:** `200 OK`

```plaintext
{
    "message": "File updated successfully",
    "data": {
        "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
        "link": "https://v1-docs.fileverse.io/0x16e58D772704526349dF48D2a483d553de77aEf0/10#key=RyyOcsgsKoBqjwBcC9jrGSgT8HxILR9iW1BEa6SagzeMwUHzrfCtV7taSzjU3KJx",
        "title": "API reference",
        "content": "updated content",
        "localVersion": 2,
        "onchainVersion": 1,
        "syncStatus": "pending",
        "isDeleted": 0,
        "onChainFileId": 10,
        "portalAddress": "0x16e58D772704526349dF48D2a483d553de77aEf0"
    }
}
```

**Errors**

| Status | Condition                                                                      |
| ------ | ------------------------------------------------------------------------------ |
| 400    | Neither title nor content provided; invalid API key; or other validation error |
| 404    | No document found for the given `ddocId`                                       |

* * *

### Delete document

Soft-deletes a document. It is removed from normal list/get; a background job is queued for on-chain sync.

**Request**

* **Method:** `DELETE`
* **Path:** `/api/ddocs/:ddocId`

| Path param | Type   | Description                              |
| ---------- | ------ | ---------------------------------------- |
| `ddocId`   | string | Short public identifier of the document. |

**Response:** `200 OK`

```plaintext
{
    "message": "File deleted successfully",
    "data": {
        "_id": "019c3387-3b49-7d7d-8a63-d3eeb453f0d7",
        "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
        "title": "API reference",
        "content": "updated content",
        "localVersion": 2,
        "onchainVersion": 2,
        "syncStatus": "pending",
        "isDeleted": 1,
        "onChainFileId": 10,
        "portalAddress": "0x16e58...",
        "metadata": {
            "title": "I2+VUMt...",
            "size": 191,
            "mimeType": "application/json",
            "appLock": {
                "lockedFileKey": "A2Hh7v....",
                "lockedLinkKey": "A2Hh7v....",
                "lockedChatKey": "A2Hh7v...."
            },
            "ownerLock": {
                "lockedFileKey": "A2Hh7v....",
                "lockedLinkKey": "A2Hh7v....",
                "lockedChatKey": "A2Hh7v...."
            },
            "ddocId": "u154d6GbzaNYHzKZ2wDyrf",
            "nonce": "ERdNKM...",
            "owner": "0x8dff...",
            "version": "4",
            "sourceApp": "satellite"
        },
        "createdAt": "2026-02-06 15:17:06",
        "updatedAt": "2026-02-06T15:32:59.485Z",
        "linkKey": "A2Hh7v....",
        "linkKeyNonce": "ERdNKM...",
        "commentKey": "bJCsBb",
        "link": "https://v1-docs.fileverse.io/0x16e..."
    }
}
```

**Errors**

| Status | Condition                                |
| ------ | ---------------------------------------- |
| 400    | Missing `ddocId` or invalid API key      |
| 404    | No document found for the given `ddocId` |

* * *

## Current scope and roadmap

This section summarises where Satellite fits today and what might change later.

### Where satellite fits today

| What you get                                 | How it helps                                                                                                                                      |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| REST API for documents                       | Create, list, get, update, and delete documents over HTTP for use by LLMs, agents, tools, MCP servers, or custom scripts.                         |
| Persistent docs                              | Documents are stored and can be synced on-chain as a stable source of truth.                                                                      |
| Self-hosted                                  | You run the Satellite server; docs and traffic stay on your infrastructure.                                                                       |
| API-first                                    | No built-in UI; the primary interface is the API.                                                                                                 |
| Title + content                              | Each document has a title and body (e.g. markdown), suited for notes or verifiable reference.                                                     |
| MCP server or official CLI for Cursor/agents | One-time setup in Cursor or CLI; then create, list, and edit documents via natural language or commands instead of calling the REST API yourself. |

### What this API does not provide (yet)

| Expectation                   | Status                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| Built-in collaborative editor | Not included. Editing is supported via the CLI (e.g. open in your editor). |
| Zero config                   | Some setup is required (server and environment configuration).             |

### Future possibilities

While these are not promises but few possibilities which were suggested by some of our users. While we haven’t integrated these yet, but we have thought about these suggestions. As of now, we’re excited to see how people use satellite and the feedback we receive, which will nudge us towards the right path forward.

