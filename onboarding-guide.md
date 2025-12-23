# Satellite - Onboarding Guide

## Overview

**Satellite** is a document management system that stores and syncs documents (called "ddocs") between a local SQLite database and a blockchain. It provides both a REST API and a CLI tool (`ddctl`) for managing ddocs.

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
2. **Worker**: Background worker that processes sync jobs (publishes to blockchain)
3. **CLI Tool**: Command-line interface (`ddctl`) for managing ddocs
4. **Database**: SQLite database storing ddocs locally
5. **Queue**: BullMQ (Redis-based) for async job processing

### Data Flow

1. **Create/Update/Delete** → Domain layer saves to SQLite → Event added to queue
2. **Worker** processes queue → Publishes to blockchain → Updates sync status

## Setup

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Redis (for queue processing)

### Installation

```bash
git clone <repo-url>
cd satellite
npm install
```

### Configuration

1. Copy environment template:
```bash
cp config/.env.example config/.env
```

2. Configure environment variables in `config/.env`:
```env
PORT=8001
IP=127.0.0.1
REDIS_URI=redis://localhost:6379
NODE_ENV=development
SYNC_WORKER_CONCURRENCY=5
SYNC_WORKER_MAX_JOBS=10
DB_PATH=/absolute/path/to/sqlite_db_name.db  # REQUIRED: Must be absolute path
```

**Important Notes:**
- `DB_PATH` is **required** and must be an **absolute path**
- The directory will be created automatically if it doesn't exist
- Example: `DB_PATH=/absolute/path/to/your/sqlite_db_name.db`

## Building & Running

### Building the Project

**Always clean before building to avoid stale compiled code:**

```bash
# Clean old compiled code and rebuild
npm run clean && npm run build
```

**Why clean before build?**
- TypeScript compiler only updates changed files
- Old compiled code can remain in `dist/` directory
- Stale code causes errors that don't match your source
- Always run `npm run clean && npm run build` after:
  - Initial setup
  - Pulling new changes
  - Making code changes
  - Seeing weird errors

### Development Mode

**API Server:**
```bash
npm run dev
# Runs on http://127.0.0.1:8001
```

**Worker (separate terminal):**
```bash
npm run dev:worker
# Processes sync jobs from queue
```

**CLI Tool:**
```bash
npm run dev:cli <command>
# Example: npm run dev:cli list
# Uses ts-node - no build needed
```

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
# Shows metadata table
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

Base URL: `http://127.0.0.1:8001/api/ddocs`

### Endpoints

#### List Ddocs
```http
GET /api/ddocs?limit=10&skip=0
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
GET /api/ddocs/:ddocId
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
POST /api/ddocs
Content-Type: multipart/form-data

file: <file>
```

**Option 2: JSON**
```http
POST /api/ddocs
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
PUT /api/ddocs/:ddocId
Content-Type: multipart/form-data

file: <file>
```

**Option 2: JSON**
```http
PUT /api/ddocs/:ddocId
Content-Type: application/json

{
  "title": "Updated Title",  // optional
  "fileContent": "Updated content..."  // optional
}
```

**Note:** At least one of `title` or `fileContent` must be provided.

#### Delete Ddoc
```http
DELETE /api/ddocs/:ddocId
```

**Response:**
```json
{
  "message": "File deleted successfully",
  "data": { ... }
}
```

## Project Structure

```
src/
├── app.ts                 # Express app setup
├── index.ts               # API server entry point
├── worker.ts              # Worker entry point
├── commands/              # CLI commands
│   ├── index.ts           # CLI entry point
│   ├── listCommand.ts
│   ├── getCommand.ts
│   ├── createCommand.ts
│   ├── updateCommand.ts
│   ├── deleteCommand.ts
│   ├── downloadCommand.ts
│   └── viewCommand.ts
├── domain/                # Business logic
│   ├── file/              # File/DDoc domain
│   ├── folder/            # Folder domain (not covered)
│   ├── portal/            # Blockchain publishing
│   └── search/            # Search functionality
├── infra/                 # Infrastructure
│   ├── database/          # SQLite database
│   │   ├── connection.ts  # DB connection manager
│   │   ├── migrations/    # Database migrations
│   │   └── models/        # Data models
│   ├── queue/             # BullMQ queue
│   │   ├── connection.ts  # Redis connection
│   │   ├── queueManager.ts
│   │   └── workerManager.ts
│   ├── cache/             # Redis cache
│   └── logger.ts          # Logging
└── interface/             # API layer
    ├── api/
    │   ├── handlers/      # Request handlers
    │   └── router/        # Express routes
    └── middleware/        # Express middleware
```

## Key Files

- **`src/infra/database/connection.ts`**: Database connection manager (handles CLI vs API paths)
- **`src/domain/file/index.ts`**: Core file operations (create, update, delete, list)
- **`src/infra/queue/workerManager.ts`**: Processes sync jobs and publishes to blockchain
- **`src/domain/portal/publish.ts`**: Blockchain publishing logic

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

## Sync Process

1. **Create/Update/Delete** operation happens in local DB
2. **FileEvent** added to BullMQ queue with type (`create`, `update`, `delete`)
3. **Worker** picks up event and calls `publishFile()`
4. **On success**: Updates `onchainVersion` and sets `syncStatus` to `synced`
5. **On failure**: `syncStatus` remains `pending` (will retry)

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
- Ensure `DB_PATH` is set to an **absolute path** in `config/.env`
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

### Worker not processing jobs
- Verify Redis is running: `redis-cli ping`
- Check `REDIS_URI` in config
- Check worker logs for errors

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
- Review migration files in `src/infra/database/migrations/`
- Explore test files (if any) for usage examples

