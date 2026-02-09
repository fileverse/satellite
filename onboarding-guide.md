# Satellite - Onboarding Guide

## Overview

**Satellite** is a document management system that stores and syncs documents (called "ddocs") between a local SQLite database and a blockchain. It provides a REST API and two CLI tools:

- **`fileverse-satellite`**: Setup and run the Satellite server (API + worker)
- **`ddctl`**: Manage ddocs from the command line

### Key Concepts

- **DDoc**: A document stored in the system with a unique `ddocId`
- **Local Version**: Version number tracked in the local database
- **On-chain Version**: Version number synced to blockchain
- **Sync Status**: `pending`, `synced`, or `failed` - indicates if local changes have been published to blockchain

## Architecture

The system follows a clean architecture pattern:

```
┌─────────────────┐
│   Interface     │  (API Routes, CLI Commands)
│     Layer       │
└────────┬────────┘
         │
┌────────▼────────┐
│   Domain        │  (Business Logic)
│     Layer       │
└────────┬────────┘
         │
┌────────▼────────┐
│ Infrastructure  │  (Database, Queue, Cache)
│     Layer       │
└─────────────────┘
```

### Components

1. **API Server**: Express.js REST API for managing ddocs
2. **Worker**: Background event processor that publishes changes to blockchain
3. **CLI Tools**:
   - `fileverse-satellite`: Setup and run the server
   - `ddctl`: Manage ddocs from command line
4. **Database**: SQLite database storing ddocs, events, folders, and configuration

### Data Flow

1. **Create/Update/Delete** → Domain layer saves to SQLite → Event record created
2. **Worker** polls events table → Publishes to blockchain → Updates sync status

## Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd satellite
npm install
```

### Configuration

Runtime config is loaded from `config/.env` or `~/.satellite/.env`. The CLI creates `~/.satellite/.env` when you run `fileverse-satellite` with your API key.

Create `config/.env` or `~/.satellite/.env` with:

```env
PORT=8001
IP=127.0.0.1
NODE_ENV=development
DB_PATH=/absolute/path/to/sqlite_db_name.db
WORKER_CONCURRENCY=5
LOG_LEVEL=info
SERVICE_NAME=satellite
```

**Important Notes:**

- `DB_PATH` is **required** and must be an **absolute path**
- The directory will be created automatically if it doesn't exist
- `WORKER_CONCURRENCY` controls how many events are processed in parallel (default: 5)
- `LOG_LEVEL` can be: `trace`, `debug`, `info`, `warn`, `error`, `fatal`

Network config (API URL, RPC, etc.) is defined in `config/network.config.json` (production) and `config/dev.network.config.json` (development, gitignored). Copy `config/dev.network.config.json.example` to `dev.network.config.json` to customize; if absent, dev scripts fall back to `network.config.json`. See [docs/CONFIG_AND_PUBLISH.md](docs/CONFIG_AND_PUBLISH.md) for the full config and publish flow.

## Building & Running

### Building the Project

**Always clean before building to avoid stale compiled code:**

```bash
# Clean old compiled code and rebuild
npm run clean && npm run build
```

`prebuild` runs before `build` and generates constants from `config/network.config.json`.

**Why clean before build?**

- TypeScript compiler only updates changed files
- Old compiled code can remain in `dist/` directory
- Stale code causes errors that don't match your source
- Always run `npm run clean && npm run build` after:
  - Initial setup
  - Pulling new changes
  - Making code changes
  - Seeing weird errors

For the full config and publish flow, see [docs/CONFIG_AND_PUBLISH.md](docs/CONFIG_AND_PUBLISH.md).

### Development Mode

**API Server:**

```bash
npm run dev
# Generates constants from config/dev.network.config.json, then runs on http://127.0.0.1:8001
```

**Worker (separate terminal):**

```bash
npm run dev:worker
# Generates constants from config/dev.network.config.json, then processes sync jobs from queue
```

**CLI Tool:**

```bash
npm run dev:cli <command>
# Example: npm run dev:cli list
# Uses ts-node - no build needed
```

### Quick Start with `fileverse-satellite`

The `fileverse-satellite` CLI provides an all-in-one setup and run experience:

```bash
fileverse-satellite --apiKey <key> --rpcUrl <url>
```

This command will:

1. Prompt for any missing configuration values
2. Fetch API key data from the server
3. Create/update the config file
4. Run database migrations
5. Start both the API server and worker

**Options:**

| Option           | Description                                      |
| ---------------- | ------------------------------------------------ |
| `--apiKey <key>` | API key for authentication                       |
| `--rpcUrl <url>` | RPC URL for blockchain connection                |
| `--port <port>`  | Port to run the server on (default: 8001)        |
| `--db <path>`    | Database path                                    |
| `--skip-fetch`   | Skip fetching API key data (use existing config) |

### Production Mode

1. **Build (always clean first):**

```bash
npm run clean && npm run build
# Compiles TypeScript to JavaScript in dist/
```

2. **Run API Server:**

```bash
npm run start:api
```

3. **Run Worker:**

```bash
npm run start:worker
```

4. **Setup CLI (first time only):**

```bash
# Make sure you're in the project root directory
cd /path/to/satellite

# Set execute permissions
chmod +x dist/commands/index.js

# Link globally (must be run from project root)
npm link

# Verify
ddctl --help
```

**Important:** `npm link` must be run from the project root directory (where `package.json` is located). It reads `package.json` to find the `bin` field, and the paths are relative to the project root.

5. **Use CLI:**

```bash
ddctl <command>
# Example: ddctl list
# Works from any directory
```

### Database Migrations

Migrations run automatically on startup for both API server and CLI tool. They are **idempotent** - meaning they check which migrations have already been applied and only run pending ones.

**Important Notes:**

- Both API (`src/index.ts`) and CLI (`src/commands/index.ts`) run migrations on startup
- Since they use the same database (via `DB_PATH`), only the first one to run will actually apply migrations
- If migrations are already applied, subsequent runs will skip them (safe to run multiple times)
- **Why CLI might work without migrations:** If you've run the API server before, migrations were already applied to the database. The CLI can then work without running migrations again.
- **However, keep migrations in CLI** for cases where CLI is used first on a fresh database

To run migrations manually:

```bash
npm run migrate
```

## CLI Tool (`ddctl`)

The CLI tool works from any directory because `DB_PATH` is resolved to an absolute path at startup. Both API and CLI use the same database location specified by `DB_PATH`.

### Commands

#### List ddocs

```bash
ddctl list
ddctl list --limit 10 --skip 20
```

#### Get ddoc details

```bash
ddctl get <ddocId>
# Shows metadata table including link (if synced)
```

#### View ddoc content

```bash
ddctl view <ddocId>
ddctl view <ddocId> --lines 20
# Preview first N lines of content
```

#### Create ddoc

```bash
ddctl create <filepath>
# Creates ddoc from file (title = filename)
```

#### Update ddoc

```bash
ddctl update <ddocId> --file <filepath>
# Updates ddoc from file

ddctl update <ddocId>
# Opens content in editor ($EDITOR or vi)
```

#### Download ddoc

```bash
ddctl download <ddocId>
ddctl download <ddocId> --output myfile.md
# Downloads to local file
```

#### Delete ddoc

```bash
ddctl delete <ddocId>
ddctl delete <ddocId1> <ddocId2> <ddocId3>
# Soft delete (can delete multiple)
```

## REST API

Base URL: `http://127.0.0.1:8001`

### Authentication

All `/api/*` endpoints require API key authentication via query parameter:

```
?apiKey=<your-api-key>
```

The API key is the same key you provided during `fileverse-satellite` setup. Requests without a valid API key will receive a `401 Unauthorized` response.

### Health Check

```http
GET /ping
```

**Response:** `pong`

**Note:** The `/ping` endpoint does not require authentication.

### Ddocs Endpoints

#### List Ddocs

```http
GET /api/ddocs?apiKey=<key>&limit=10&skip=0
```

**Response:**

```json
{
  "ddocs": [...],
  "total": 100,
  "hasNext": true
}
```

#### Get Ddoc

```http
GET /api/ddocs/:ddocId?apiKey=<key>
```

**Response:**

```json
{
  "_id": "...",
  "ddocId": "...",
  "title": "...",
  "content": "...",
  "localVersion": 1,
  "onchainVersion": 0,
  "syncStatus": "pending",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### Create Ddoc

**Option 1: File Upload**

```http
POST /api/ddocs?apiKey=<key>
Content-Type: multipart/form-data

file: <file>
```

**Option 2: JSON**

```http
POST /api/ddocs?apiKey=<key>
Content-Type: application/json

{
  "title": "My Document",
  "fileContent": "Document content here..."
}
```

**Response:**

```json
{
  "message": "File created successfully. Sync to on-chain is pending.",
  "data": { ... }
}
```

#### Update Ddoc

**Option 1: File Upload**

```http
PUT /api/ddocs/:ddocId?apiKey=<key>
Content-Type: multipart/form-data

file: <file>
```

**Option 2: JSON**

```http
PUT /api/ddocs/:ddocId?apiKey=<key>
Content-Type: application/json

{
  "title": "Updated Title",  // optional
  "fileContent": "Updated content..."  // optional
}
```

**Note:** At least one of `title` or `fileContent` must be provided.

#### Delete Ddoc

```http
DELETE /api/ddocs/:ddocId?apiKey=<key>
```

**Response:**

```json
{
  "message": "File deleted successfully",
  "data": { ... }
}
```

### Folders Endpoints

#### List Folders

```http
GET /api/folders?apiKey=<key>&limit=10&skip=0
```

#### Create Folder

```http
POST /api/folders?apiKey=<key>
Content-Type: application/json

{
  "name": "My Folder"
}
```

#### Get Folder

```http
GET /api/folders/:folderRef/:folderId?apiKey=<key>
```

### Search Endpoints

#### Search Nodes

```http
GET /api/search?apiKey=<key>&q=<query>&limit=10&skip=0
```

**Response:**

```json
{
  "results": [...],
  "total": 50,
  "hasNext": true
}
```

## Project Structure

```
config/
├── network.config.json           # Production network config (API URL, RPC, etc.)
├── dev.network.config.json       # Dev config (gitignored, used by npm run dev)
└── dev.network.config.json.example  # Template for dev config

scripts/
└── generate-constants.cjs   # Generates src/cli/constants.generated.ts from config JSON

src/
├── app.ts                   # Express app setup
├── index.ts                 # API server entry point
├── worker.ts                # Worker entry point
├── cli/                     # Satellite CLI (fileverse-satellite)
│   ├── constants.ts         # Re-exports from constants.generated.ts
│   ├── constants.generated.ts  # Generated (gitignored), do not edit
│   ├── index.ts             # CLI entry point
│   ├── fetch-api-key.ts     # API key fetching
│   ├── process-manager.ts   # Process management
│   ├── prompts.ts           # Interactive prompts
│   └── scaffold-config.ts   # Config scaffolding
├── commands/              # Ddocs CLI (ddctl)
│   ├── index.ts           # CLI entry point
│   ├── listCommand.ts
│   ├── getCommand.ts
│   ├── createCommand.ts
│   ├── updateCommand.ts
│   ├── deleteCommand.ts
│   ├── downloadCommand.ts
│   ├── viewCommand.ts
│   └── utils/
├── config/                # Configuration loader
├── constants/             # Application constants
├── init/                  # Initialization logic
├── domain/                # Business logic
│   ├── file/              # File/DDoc domain
│   ├── folder/            # Folder domain
│   ├── portal/            # Blockchain publishing
│   └── search/            # Search functionality
├── infra/                 # Infrastructure
│   ├── database/          # SQLite database
│   │   ├── connection.ts  # DB connection manager
│   │   ├── migrations/    # Database migrations
│   │   └── models/        # Data models (files, folders, events, apikeys, portals)
│   ├── worker/            # Event-based worker
│   │   ├── worker.ts      # Worker implementation
│   │   ├── eventProcessor.ts
│   │   └── workerSignal.ts
│   └── logger.ts          # Pino logging
├── interface/             # API layer
│   ├── api/
│   │   ├── handlers/      # Request handlers (ddocs)
│   │   └── router/        # Express routes (ddocs, folders, search)
│   └── middleware/        # Express middleware
└── sdk/                   # SDK utilities
    ├── file-encryption.ts
    ├── file-manager.ts
    ├── pimlico-utils.ts   # Account abstraction
    └── smart-agent.ts
```

## Key Files

- **`src/infra/database/connection.ts`**: Database connection manager
- **`src/domain/file/index.ts`**: Core file operations (create, update, delete, list)
- **`src/infra/worker/worker.ts`**: Event-based worker that processes sync jobs
- **`src/infra/worker/eventProcessor.ts`**: Processes individual events and publishes to blockchain
- **`src/domain/portal/publish.ts`**: Blockchain publishing logic
- **`src/cli/index.ts`**: Satellite CLI entry point (fileverse-satellite)

## Database Schema

### Files Table

```sql
CREATE TABLE files (
  _id TEXT PRIMARY KEY,
  ddocId TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  localVersion INTEGER NOT NULL DEFAULT 1,
  onchainVersion INTEGER NOT NULL DEFAULT 0,
  syncStatus TEXT NOT NULL DEFAULT 'pending',
  isDeleted INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Events Table

Stores pending sync events for the worker to process:

```sql
CREATE TABLE events (
  _id TEXT PRIMARY KEY,
  fileId TEXT NOT NULL,
  type TEXT NOT NULL,           -- 'create', 'update', 'delete'
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'failed'
  retryCount INTEGER DEFAULT 0,
  error TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  processedAt DATETIME
);
```

### Folders Table

```sql
CREATE TABLE folders (
  _id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Portals Table

Stores blockchain portal configuration:

```sql
CREATE TABLE portals (
  _id TEXT PRIMARY KEY,
  address TEXT NOT NULL,
  chainId INTEGER NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### API Keys Table

```sql
CREATE TABLE apikeys (
  _id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  portalId TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Sync Process

1. **Create/Update/Delete** operation happens in local DB
2. **Event record** created in `events` table with type (`create`, `update`, `delete`)
3. **Worker** polls for pending events and processes them concurrently
4. **On success**: Updates `onchainVersion`, sets `syncStatus` to `synced`, marks event as `processed`
5. **On failure**: Event marked for retry (up to 3 attempts), then marked as `failed`

## Type System

### Domain Types (`src/domain/file/types.ts`)

- `CreateFileInput`: `{ title: string, content: string }`
- `UpdateFileInput`: `{ title?: string, content?: string }`

### API Types (`src/interface/api/handlers/ddocs/types.ts`)

- `ClientUpdateFileInput`: Client-facing update type (maps to `UpdateFileInput`)

**Note:** Domain layer is independent - API layer depends on domain, not vice versa.

## Common Tasks

### Adding a New CLI Command

1. Create command file in `src/commands/`
2. Import and add to `src/commands/index.ts`
3. Export domain function if needed

### Adding a New API Endpoint

1. Add handler in `src/interface/api/handlers/ddocs/`
2. Add route in `src/interface/api/router/ddocs/index.ts`
3. Implement domain logic in `src/domain/file/`

### Running Migrations

Migrations run automatically. To create a new one:

```bash
npm run migrate:create <migration-name>
```

## Troubleshooting

### CLI doesn't work from other directories

- Ensure `DB_PATH` is set to an **absolute path** in `config/.env` or `~/.satellite/.env`
- Check that migrations have run (they run automatically)
- Verify the path is correct: check logs for "SQLite database connected: <path>"

### CLI command not found or permission denied

- Build the project: `npm run clean && npm run build`
- Set execute permissions: `chmod +x dist/commands/index.js`
- Link globally: `npm link`

### Code works in dev but not production

- **Most common issue:** Stale `dist/` folder
- Solution: `npm run clean && npm run build`
- This ensures compiled code matches source code

### Worker not processing events

- Ensure worker is running (`npm run start:worker` or via `fileverse-satellite`)
- Check for failed events in the `events` table
- Review worker logs for error messages
- Verify `WORKER_CONCURRENCY` setting is appropriate

### Database errors

- Ensure `DB_PATH` is set and is an absolute path
- Ensure database directory exists and is writable
- Migrations run automatically on startup
- Check database path in logs

## Next Steps

1. **Explore the codebase**: Start with `src/domain/file/index.ts` to understand core operations
2. **Test the API**: Use Postman or curl to test endpoints
3. **Try the CLI**: Run `ddctl list` to see existing ddocs
4. **Check worker logs**: Monitor sync job processing
5. **Read domain logic**: Understand how publishing works in `src/domain/portal/`

## Additional Resources

- Check `README.md` for basic setup
- See [docs/CONFIG_AND_PUBLISH.md](docs/CONFIG_AND_PUBLISH.md) for config flow and publish pipeline
- Review migration files in `src/infra/database/migrations/`
- Explore test files (if any) for usage examples
