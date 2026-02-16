---
name: ddocs-research-documentation
description: Researches topics using web search and conversation context, then creates structured research documentation published as blockchain-synced Fileverse ddocs with proper citations and actionable insights.
---

# Research & Documentation for ddocs

Enables comprehensive research workflows: search the web for information, analyze and synthesize findings, and publish well-structured research documentation as Fileverse ddocs — end-to-end encrypted documents synced to blockchain.

## Quick Start

When asked to research and document a topic:

1. **Research the topic**: Use web search to gather information from authoritative sources
2. **Select output format**: Choose the right format based on the request (see [reference/format-selection-guide.md](reference/format-selection-guide.md))
3. **Structure the content**: Synthesize findings into a well-organized markdown document with citations
4. **Create the ddoc**: Use `fileverse_create_document` to publish and wait for blockchain sync
5. **Return the link**: Share the blockchain-synced link with the user

## Research Workflow

### Step 1: Gather information

```
Use web search to find authoritative sources on the topic
Collect information from user-provided content or conversation context
Search existing ddocs if relevant (fileverse_search_documents)
```

### Step 2: Select output format

```
Choose format based on the request type:
  Comparing options? → Comparison Format
  Time-sensitive/simple? → Quick Brief
  Formal/extensive analysis? → Comprehensive Report
  Default → Research Summary
```

See [reference/format-selection-guide.md](reference/format-selection-guide.md) for the decision tree.

### Step 3: Structure and write content

```
Apply the selected template from reference/
Include proper citations using [Title](URL) markdown links
Organize findings with clear headings and sections
Add actionable conclusions and next steps
```

### Step 4: Create the ddoc

```
fileverse_create_document
  title: "Research: [Topic] - [Date]"
  content: "[Structured markdown content]"
```

The tool blocks until blockchain sync completes (up to 60s). Always return the `link` field to the user.

## Output Formats

Choose the appropriate format based on the request:

**Research Summary**: See [reference/research-summary-format.md](reference/research-summary-format.md)
**Comprehensive Report**: See [reference/comprehensive-report-format.md](reference/comprehensive-report-format.md)
**Quick Brief**: See [reference/quick-brief-format.md](reference/quick-brief-format.md)
**Comparison**: See [reference/comparison-format.md](reference/comparison-format.md)

## Available Tools

| Tool | Purpose |
|------|---------|
| `fileverse_create_document` | **Core** — publish research as a blockchain-synced ddoc |
| `fileverse_search_documents` | Find existing ddocs to avoid duplicates or cross-reference |
| `fileverse_get_document` | Retrieve a ddoc by `ddocId` for verification |
| `fileverse_update_document` | Revise a previously published ddoc |
| `fileverse_get_sync_status` | Check sync status if needed |
| `fileverse_retry_failed_events` | Retry failed blockchain sync events |

## Searching Existing Ddocs

Before creating new research, check for existing ddocs on the same topic:

```
fileverse_search_documents
  query: "[research topic]"
```

If a relevant ddoc exists, consider updating it with `fileverse_update_document` instead of creating a duplicate.

## Best Practices

1. **Research thoroughly**: Use multiple web searches with varied queries to get comprehensive coverage
2. **Cite all sources**: Use `[Source Title](URL)` markdown links for every claim (see [reference/citations.md](reference/citations.md))
3. **Verify recency**: Prefer recent sources and note publication dates
4. **Cross-reference**: Validate findings across multiple sources
5. **Structure clearly**: Use headings, bullets, tables, and formatting for readability
6. **Search before creating**: Check for existing ddocs on the topic to avoid duplicates
7. **Always return the link**: After creating a ddoc, share the blockchain-synced link with the user

## Blockchain Sync

After creating or updating a ddoc, the tool waits for blockchain sync automatically. See [reference/blockchain-sync.md](reference/blockchain-sync.md) for details on the sync lifecycle and error recovery.

## Common Issues

**Sync status "pending"**: The tool polls automatically. If it times out, use `fileverse_get_sync_status` to check later.
**Sync status "failed"**: Call `fileverse_retry_failed_events` to retry. Failures are typically caused by blockchain rate limits or transient network errors.
**Connection refused**: Ensure the fileverse-api server is running (`fileverse-api` or `npm run dev`).

## Examples

See [examples/](examples/) for complete workflow demonstrations:
- [examples/market-research.md](examples/market-research.md) - Web research → Research Summary ddoc
- [examples/technical-documentation.md](examples/technical-documentation.md) - Technical deep-dive → Comprehensive Report ddoc
- [examples/comparison-analysis.md](examples/comparison-analysis.md) - Multi-option evaluation → Comparison ddoc
