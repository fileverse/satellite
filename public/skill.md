# Fileverse API - Slash Command Skills

> Ready-to-use slash command files for Claude Code and other tools that support markdown-based command prompts. Create a `.claude/commands/` directory in your project and add these files.

Fetch this via `GET {SERVER_URL}/skill.md`. See `{SERVER_URL}/llm.txt` for the full integration guide.

---

## `.claude/commands/fileverse-publish.md`

```markdown
Publish a file to Fileverse blockchain storage.

Steps:
1. Read the file at: $ARGUMENTS
2. Use the fileverse_create_document MCP tool with the filename (without extension) as the title and the file contents as content.
3. If MCP tools are not available, fall back to the REST API:
   - Read credentials from ~/.fileverseapirc (JSON with apiKey and serverUrl fields)
   - POST to {serverUrl}/api/ddocs?apiKey={apiKey} with JSON body: {"title": "<filename>", "content": "<file contents>"}
   - Extract ddocId from response.data.ddocId
   - Poll GET {serverUrl}/api/ddocs/{ddocId}?apiKey={apiKey} every 5s until syncStatus is "synced" or "failed"
4. If synced: show "Published! Link: {link}"
5. If failed: show "Saved locally but blockchain sync failed"
```

Usage: `/fileverse-publish path/to/document.md`

---

## `.claude/commands/fileverse-list.md`

```markdown
List all documents stored in Fileverse.

Steps:
1. Use the fileverse_list_documents MCP tool with limit 50.
2. If MCP tools are not available, fall back to the REST API:
   - Read credentials from ~/.fileverseapirc
   - GET {serverUrl}/api/ddocs?apiKey={apiKey}&limit=50
3. Display results as a table with columns: ddocId, title, syncStatus, link, updatedAt
4. Show total count and whether more documents exist (hasNext)
```

Usage: `/fileverse-list`

---

## `.claude/commands/fileverse-search.md`

```markdown
Search for documents in Fileverse.

Steps:
1. Use the fileverse_search_documents MCP tool with query: $ARGUMENTS
2. If MCP tools are not available, fall back to the REST API:
   - Read credentials from ~/.fileverseapirc
   - GET {serverUrl}/api/search?apiKey={apiKey}&q=$ARGUMENTS
3. Display matching documents with: ddocId, title, syncStatus, link
4. Show total matches found
```

Usage: `/fileverse-search meeting notes`

---

## `.claude/commands/fileverse-status.md`

```markdown
Check the sync status of a Fileverse document.

Steps:
1. Use the fileverse_get_sync_status MCP tool with ddocId: $ARGUMENTS
2. If MCP tools are not available, fall back to the REST API:
   - Read credentials from ~/.fileverseapirc
   - GET {serverUrl}/api/ddocs/$ARGUMENTS?apiKey={apiKey}
3. Display:
   - Title
   - Sync Status (pending/synced/failed)
   - Link (if synced)
   - Local Version vs On-chain Version
   - Last Updated
4. If status is "failed", offer to retry using fileverse_retry_failed_events or POST {serverUrl}/api/events/retry-failed?apiKey={apiKey}
```

Usage: `/fileverse-status <ddocId>`

---

## `.claude/commands/fileverse-delete.md`

```markdown
Delete a document from Fileverse.

Steps:
1. If $ARGUMENTS looks like a ddocId, use it directly. Otherwise, search for it:
   - Use fileverse_search_documents MCP tool (or GET /api/search) with $ARGUMENTS as the query
   - Show matching documents and ask the user to confirm which one to delete
2. Use the fileverse_delete_document MCP tool with the ddocId.
3. If MCP tools are not available:
   - Read credentials from ~/.fileverseapirc
   - DELETE {serverUrl}/api/ddocs/{ddocId}?apiKey={apiKey}
4. Confirm deletion to the user.
```

Usage: `/fileverse-delete <ddocId or search term>`
