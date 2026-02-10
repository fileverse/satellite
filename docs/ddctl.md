---
title: ddctl CLI Reference
date: 2026-02-10
---

# ddctl CLI Reference

`ddctl` is a command‑line tool for managing your ddocs from the terminal. It talks to your local Satellite instance so you can create, list, inspect, update, and delete documents without making HTTP requests yourself.

## Table of Contents

* [Overview](#overview)
* [Commands](#commands)
  
  * [list](#list)
  * [get](#get)
  * [create](#create)
  * [update](#update)
  * [delete](#delete)
  * [download](#download)
  * [view](#view)
* [How ddctl relates to the API](#how-ddctl-relates-to-the-api)

* * *

## Overview

When you install `@fileverse/satellite` globally, you get access to two commands:

- `satellite` — starts the Satellite server (HTTP API + worker)
- `ddctl` — manages ddocs using that local Satellite instance

Use `ddctl` when you prefer a CLI workflow (shell scripts, Makefiles, dev tooling) over calling the REST API directly.

For installation options and how to run the Satellite server, see the [Install on your local computer](./local-setup.md) guide.

* * *

## Commands

### list

List ddocs associated with your configured API key.

**Usage:**

```bash
ddctl list
ddctl list --limit <number>
ddctl list --skip <number>
ddctl list -l <number> -s <number>
```

**Options:**

| Flag                    | Description                              |
| ----------------------- | ---------------------------------------- |
| `-l, --limit <number>`  | Limit the number of results returned.    |
| `-s, --skip <number>`   | Skip the first N results (pagination).   |

This prints a table of ddocs with their IDs, titles, sync status, versions, and timestamps, along with a total count. If more results are available, it will tell you to use `--skip` and `--limit` for pagination.

* * *

### get

Retrieve a single ddoc by its `ddocId` and display its metadata.

**Usage:**

```bash
ddctl get <ddocId>
```

**Example:**

```bash
ddctl get u154d6GbzaNYHzKZ2wDyrf
```

This prints a table with details like title, sync status, local/on‑chain versions, created/updated timestamps, and whether the ddoc has been deleted. If the ddoc has a public link, it will also be shown.

* * *

### create

Create a new ddoc from a local file. The file contents become the document body, and the filename becomes the title.

**Usage:**

```bash
ddctl create <FILE_PATH>
```

**Example:**

```bash
ddctl create ./docs/my-note.md
```

`ddctl` will validate that the file exists and is not empty, read the contents, create a new ddoc associated with your portal, and print a table with the new `ddocId`, title, status, and version information.

* * *

### update

Update an existing ddoc. You can update in two ways:

**Usage:**

**1. Update from a file:**

```bash
ddctl update <ddocId> --file <FILE_PATH>
ddctl update <ddocId> -f <FILE_PATH>
```

**2. Edit in your editor:**

```bash
ddctl update <ddocId>
```

When you use `ddctl update <ddocId>` without the `--file` option, `ddctl`:

- Writes the current content to a temporary file
- Opens that file in your editor (uses the `$EDITOR` environment variable if set, otherwise defaults to `vi`)
- Compares the edited content with the original and, if changed, updates the ddoc
- Cleans up the temporary file

This editor-based workflow lets you edit documents directly in your preferred editor without creating intermediate files.

**Examples:**

```bash
# Update from a file
ddctl update u154d6GbzaNYHzKZ2wDyrf --file ./docs/updated-note.md

# Edit in your editor (uses $EDITOR or defaults to vi)
ddctl update u154d6GbzaNYHzKZ2wDyrf
```

* * *

### delete

Delete one or more ddocs by their IDs. Deletion follows the same semantics as the API (soft delete with background sync).

**Usage:**

```bash
ddctl delete <ddocId>
ddctl delete <ddocId1> <ddocId2> <ddocId3>
```

**Example:**

```bash
ddctl delete u154d6GbzaNYHzKZ2wDyrf
ddctl delete u154d6GbzaNYHzKZ2wDyrf x71Aa9FbCkLmNoPqRsTu abc123def456
```

Each ddoc is processed individually. If an error occurs for a particular ID, it is printed, and `ddctl` continues with the remaining IDs.

* * *

### download

Download the content of a ddoc into a local markdown file.

**Usage:**

```bash
ddctl download <ddocId>
ddctl download <ddocId> --output <filename>
ddctl download <ddocId> -o <filename>
```

**Examples:**

```bash
# Use the existing title as the filename
ddctl download u154d6GbzaNYHzKZ2wDyrf

# Explicit output filename (extension .md is added if missing)
ddctl download u154d6GbzaNYHzKZ2wDyrf --output my-doc
ddctl download u154d6GbzaNYHzKZ2wDyrf -o my-doc.md
```

On success, `ddctl` prints the path where the file was saved.

* * *

### view

Preview a ddoc's content directly in the terminal.

**Usage:**

```bash
ddctl view <ddocId>
ddctl view <ddocId> --lines <number>
ddctl view <ddocId> -n <number>
```

**Examples:**

```bash
# Show first 10 lines (default)
ddctl view u154d6GbzaNYHzKZ2wDyrf

# Show first 30 lines
ddctl view u154d6GbzaNYHzKZ2wDyrf --lines 30
ddctl view u154d6GbzaNYHzKZ2wDyrf -n 30
```

If the content is longer than the requested preview, `ddctl` prints how many lines were omitted and how many total lines the document contains.

* * *

## How ddctl relates to the API

Under the hood, `ddctl` uses the same underlying document model and storage as the Satellite REST API described in the [Satellite API Reference](./api-documentation.md).

You can think of it as:

- **`/api/ddocs` + tools** — `ddctl` wraps Satellite's APIs and local database logic in CLI commands.
- **Same data, different interface** — any document created or updated via `ddctl` is reflected in API responses, and vice versa.

This makes it easy to:

- Use the API in production systems and agents.
- Use `ddctl` in your local workflows, scripts, and development environments.
