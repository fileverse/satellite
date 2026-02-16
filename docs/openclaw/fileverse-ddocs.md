# Fileverse ddocs Skill

> Manage documents (ddocs) on Fileverse — an end-to-end encrypted, private document editor at ddocs.new. Documents are synced to the blockchain and each has a unique `ddocId`.

Only markdown (.md) content is supported.

---

## Available Tools

| Tool | Description |
|------|-------------|
| `fileverse_list_documents` | List documents with optional `limit` and `skip` for pagination |
| `fileverse_get_document` | Get a single document by `ddocId` |
| `fileverse_create_document` | Create a document (title + content) and wait for blockchain sync |
| `fileverse_update_document` | Update a document's title and/or content, then wait for sync |
| `fileverse_delete_document` | Delete a document by `ddocId` |
| `fileverse_search_documents` | Search documents by text query |
| `fileverse_get_sync_status` | Check sync status and blockchain link |
| `fileverse_retry_failed_events` | Retry all failed blockchain sync events |

---

## Workflows

### Create a ddoc

Use `fileverse_create_document` with `title` and `content` (markdown). The tool blocks until blockchain sync completes (up to 60s). Always return the `link` field to the user.

### Create a ddoc from a local file

1. Read the file contents
2. Use the filename (without extension) as the title
3. Call `fileverse_create_document` with the title and file content
4. Return the shareable `link` to the user

### Update a ddoc

Use `fileverse_update_document` with the `ddocId` and the new `title` and/or `content`. Only provided fields are updated.

### Find a ddoc

Use `fileverse_search_documents` with a `query` string. Results are ranked by relevance. Use `skip` and `limit` for pagination.

### List all ddocs

Use `fileverse_list_documents`. Check `hasNext` to determine if more pages are available. Use `skip` and `limit` to paginate.

### Delete a ddoc

Use `fileverse_delete_document` with the `ddocId`. Deletion is permanent.

### Handle sync failures

If a document has `syncStatus: "failed"`, call `fileverse_retry_failed_events`. Failed events are typically caused by blockchain rate limits or transient network errors. Max 10 retry attempts per event.

### Check sync status

If create/update returns `syncStatus: "pending"`, poll with `fileverse_get_sync_status` until it becomes `"synced"` before giving the user the link.

---

## Sync Lifecycle

```
Create/Update -> pending -> synced (link available)
                         -> failed (retry with fileverse_retry_failed_events)
```

---

## Best Practices

1. **Always return the link** after creating or updating a document
2. **Search before creating** to avoid duplicates when the user wants to update an existing ddoc
3. **Use markdown formatting** — headings, lists, code blocks, and tables are all supported
4. **Paginate large results** using `skip` and `limit`
5. **Poll for sync** if status is `"pending"` before sharing the link

---

## Constraints

| Constraint | Value |
|------------|-------|
| Max content size | 10 MB |
| Default page size | 10 documents |
| Sync timeout | 60 seconds |
| Sync poll interval | 3 seconds |
| Max event retries | 10 attempts |
