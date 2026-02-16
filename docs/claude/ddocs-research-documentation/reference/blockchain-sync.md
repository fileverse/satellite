# Blockchain Sync Guide

## Sync Lifecycle

When a ddoc is created or updated, it goes through a sync process to persist on the blockchain:

```
Create/Update → pending → synced (link available)
                        → failed (retry available)
```

## Automatic Sync

`fileverse_create_document` and `fileverse_update_document` **wait for sync automatically** — they block until the document reaches `synced` status or times out (60 seconds). Once synced, the response includes a `link` field with the blockchain-accessible URL.

```
fileverse_create_document
  title: "Research: Topic"
  content: "# Research content..."

→ Response includes:
  syncStatus: "synced"
  link: "https://docs.fileverse.io/0x.../10#key=..."
```

## Manual Sync Check

If you need to check sync status independently (e.g., after a timeout):

```
fileverse_get_sync_status
  ddocId: "abc123"

→ Response:
  syncStatus: "synced" | "pending" | "failed"
  link: "https://..." (if synced)
```

## Handling Pending Status

If create/update returns `syncStatus: "pending"`:

1. Wait a few seconds
2. Poll with `fileverse_get_sync_status` using the `ddocId`
3. Repeat until status becomes `"synced"` or `"failed"`

Poll interval: 3 seconds. Max timeout: 60 seconds.

## Failed Sync Recovery

If `syncStatus: "failed"`, the blockchain transaction did not complete. Common causes:
- Blockchain rate limits
- Transient network errors
- Gas estimation failures

To retry:

```
fileverse_retry_failed_events
```

This retries **all** failed sync events (not just one document). Each event has a maximum of 10 retry attempts.

## Version Tracking

Each ddoc tracks two version numbers:

| Field | Description |
|-------|-------------|
| `localVersion` | Increments on every local update |
| `onchainVersion` | Increments when blockchain sync completes |

When `localVersion > onchainVersion`, there are local changes not yet synced to the blockchain.

## Best Practices

1. **Always return the link** — after creating a ddoc, share the `link` field with the user
2. **Don't poll excessively** — the create/update tools handle polling internally
3. **Batch retries** — `fileverse_retry_failed_events` retries all failed events at once
4. **Check before sharing** — only share the link when `syncStatus` is `"synced"`
