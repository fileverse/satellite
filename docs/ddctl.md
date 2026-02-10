---
title: ddctl CLI Reference
date: 2026-02-10
---

# ddctl CLI Reference

`ddctl` is a command‑line tool for managing your ddocs from the terminal. It talks to your local Satellite instance so you can create, list, inspect, update, and delete documents without making HTTP requests yourself.

## Table of Contents

* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [Basic usage](#basic-usage)
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

## Prerequisites

Before using `ddctl`, make sure:

- **Satellite is installed** — via `npx @fileverse/satellite` or `npm install -g @fileverse/satellite`.
- **The Satellite server has been started at least once** and configured with your Fileverse API key and other required values (see `satellite` usage in `local-setup.md`).
- **You are in the same environment** (machine/user) where Satellite is storing its local database; `ddctl` reads configuration (including your API key and portal) from there.

You can verify that `ddctl` is available by running:

```bash
ddctl --help
```

This prints a list of available commands and options.

* * *

## Basic usage

The general pattern for using `ddctl` is:

```bash
ddctl <command> [options] [arguments]
```

Examples:

```bash
ddctl list
ddctl create ./notes/api-reference.md
ddctl get u154d6GbzaNYHzKZ2wDyrf
ddctl update u154d6GbzaNYHzKZ2wDyrf --file ./notes/updated-api-reference.md
ddctl delete u154d6GbzaNYHzKZ2wDyrf
ddctl download u154d6GbzaNYHzKZ2wDyrf --output api-reference
ddctl view u154d6GbzaNYHzKZ2wDyrf --lines 20
```

If a required configuration (such as API key or portal) is missing from your Satellite setup, `ddctl` will exit with an error message explaining what is missing.

* * *

## Commands

### list

List ddocs for the portal associated with your configured API key.

**Usage**

```bash
ddctl list [options]
```

**Options**

| Flag                    | Description                              |
| ----------------------- | ---------------------------------------- |
| `-l, --limit <number>`  | Limit the number of results returned.    |
| `-s, --skip <number>`   | Skip the first N results (pagination).   |

**Example**

```bash
ddctl list --limit 20 --skip 10
```

This prints a table of ddocs with their IDs, titles, sync status, versions, and timestamps, along with a total count. If more results are available, it will tell you to use `--skip` and `--limit` for pagination.

* * *

### get

Retrieve a single ddoc by its `ddocId` and display its metadata.

**Usage**

```bash
ddctl get <ddocId>
```

**Arguments**

| Name      | Description                         |
| --------- | ----------------------------------- |
| `ddocId`  | The ddoc ID you want to retrieve.   |

**Example**

```bash
ddctl get u154d6GbzaNYHzKZ2wDyrf
```

This prints a table with details like title, sync status, local/on‑chain versions, created/updated timestamps, and whether the ddoc has been deleted. If the ddoc has a public link, it will also be shown.

* * *

### create

Create a new ddoc from a local file. The file contents become the document body, and the filename becomes the title.

**Usage**

```bash
ddctl create <filepath>
```

**Arguments**

| Name        | Description                                       |
| ----------- | ------------------------------------------------- |
| `filepath`  | Path to the local file to create the ddoc from.   |

**Example**

```bash
ddctl create ./docs/my-note.md
```

`ddctl` will:

- Validate that the file exists and is not empty.
- Read the contents.
- Create a new ddoc associated with your portal.
- Print a table with the new `ddocId`, title, status, and version information.

* * *

### update

Update an existing ddoc. You can either:

- Provide a file to replace the content (and title, based on the filename), or
- Let `ddctl` open the current content in your editor for inline editing.

**Usage**

```bash
ddctl update <ddocId> [options]
```

**Arguments**

| Name      | Description                        |
| --------- | ---------------------------------- |
| `ddocId`  | The ddoc ID you want to update.   |

**Options**

| Flag                        | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `-f, --file <file_path>`    | Path to a local file whose contents will replace the ddoc.    |

**Example (update from file)**

```bash
ddctl update u154d6GbzaNYHzKZ2wDyrf --file ./docs/updated-note.md
```

**Example (edit in your editor)**

```bash
ddctl update u154d6GbzaNYHzKZ2wDyrf
```

If you omit `--file`, `ddctl`:

- Writes the current content to a temporary file.
- Opens that file in your default editor (using `$EDITOR`, falling back to `vi`).
- Compares the edited content with the original and, if changed, updates the ddoc.

On success, it prints a summary table with the updated document details.

* * *

### delete

Delete one or more ddocs by their IDs. Deletion follows the same semantics as the API (soft delete with background sync).

**Usage**

```bash
ddctl delete <ddocIds...>
```

**Arguments**

| Name         | Description                                           |
| ------------ | ----------------------------------------------------- |
| `ddocIds...` | One or more ddoc IDs (space‑separated) to delete.    |

**Example**

```bash
ddctl delete u154d6GbzaNYHzKZ2wDyrf x71Aa9FbCkLmNoPqRsTu
```

Each ddoc is processed individually. If an error occurs for a particular ID, it is printed, and `ddctl` continues with the remaining IDs.

* * *

### download

Download the content of a ddoc into a local markdown file.

**Usage**

```bash
ddctl download <ddocId> [options]
```

**Arguments**

| Name      | Description                         |
| --------- | ----------------------------------- |
| `ddocId`  | The ddoc ID you want to download.  |

**Options**

| Flag                           | Description                                             |
| ------------------------------ | ------------------------------------------------------- |
| `-o, --output <filename>`      | Output filename (extension `.md` is added if missing). |

**Examples**

```bash
# Use the existing title as the filename
ddctl download u154d6GbzaNYHzKZ2wDyrf

# Explicit output filename
ddctl download u154d6GbzaNYHzKZ2wDyrf --output my-doc
```

On success, `ddctl` prints the path where the file was saved.

* * *

### view

Preview a ddoc’s content directly in the terminal.

**Usage**

```bash
ddctl view <ddocId> [options]
```

**Arguments**

| Name      | Description                         |
| --------- | ----------------------------------- |
| `ddocId`  | The ddoc ID you want to preview.   |

**Options**

| Flag                          | Description                                                    |
| ----------------------------- | -------------------------------------------------------------- |
| `-n, --lines <number>`        | Number of lines to show (default: `10`).                      |

**Examples**

```bash
# Show first 10 lines (default)
ddctl view u154d6GbzaNYHzKZ2wDyrf

# Show first 30 lines
ddctl view u154d6GbzaNYHzKZ2wDyrf --lines 30
```

If the content is longer than the requested preview, `ddctl` prints how many lines were omitted and how many total lines the document contains.

* * *

## How ddctl relates to the API

Under the hood, `ddctl` uses the same underlying document model and storage as the Satellite REST API described in the [Satellite API Reference](./api-documentation.md).

You can think of it as:

- **`/api/ddocs` + tools** — `ddctl` wraps Satellite’s APIs and local database logic in CLI commands.
- **Same data, different interface** — any document created or updated via `ddctl` is reflected in API responses, and vice versa.

This makes it easy to:

- Use the API in production systems and agents.
- Use `ddctl` in your local workflows, scripts, and development environments.

