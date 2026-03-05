# Fileverse API

Programmatic access to dDocs: create, read, edit, and delete end-to-end encrypted documents via your LLMs, CLI, scripts, and tools. Plug it into your favourite LLM via MCP, or use it via the CLI and REST API. Everything is encrypted client-side before it leaves your device.

## Prerequisites

Log in to [ddocs.new](https://ddocs.new), open Settings, enable Developer Mode, and generate your API key.

## Quick Start

The fastest way to get started is using the `@fileverse/api` CLI:

```bash
npm install @fileverse/api
npx @fileverse/api --apiKey <key> --rpcUrl <url>
```

This will prompt for any missing values, set up configuration, run migrations, and start the server.

## Manual Setup

```bash
git clone <your-repo-url>
cd satellite
npm install
```

Configure runtime variables via `config/.env` or `~/.fileverse/.env` (see Environment Variables). The CLI creates `~/.fileverse/.env` when you run `fileverse-api` with your API key.

### Building the Project

**Important:** After installation or when making code changes, you must build the project:

```bash
# Clean old compiled code and rebuild
npm run clean && npm run build
```

`build` generates constants from `config/network.config.json` then runs tsup. For a build using dev config (e.g. to test against a local backend), use `npm run build:local` (uses `config/dev.network.config.json`).

**Why clean before build?**

- Ensures compiled code (`dist/`) matches your source code (`src/`)
- Prevents stale compiled code from causing errors
- Always run `npm run clean && npm run build` after:
  - Initial setup
  - Pulling new changes
  - Making significant code changes
  - Seeing errors that don't match your source code

For details on config flow and publishing, see [docs/CONFIG_AND_PUBLISH.md](docs/CONFIG_AND_PUBLISH.md).

## Run

### API Server

```bash
npm run start:api
```

**Note:** All `/api/*` endpoints require authentication via `?apiKey=<key>` query parameter. The API key is the same key provided during setup.

### Worker (for processing sync jobs)

```bash
npm run start:worker
```

### Development

```bash
# Run API server (uses config/dev.network.config.json)
npm run dev

# Run worker in another terminal
npm run dev:worker
```

`dev` and `dev:worker` generate constants from `config/dev.network.config.json` before starting.

## CLI Usage

The CLI tool `ddctl` provides commands to manage your ddocs from the command line.

### Setup

**Important:** All commands must be run from the project root directory (where `package.json` is located).

1. **Build the project:**

   ```bash
   npm run clean && npm run build
   ```

2. **Set execute permissions and link globally:**

   ```bash
   chmod +x dist/commands/index.js
   npm link
   ```

   **Note:** `npm link` must be run from the project root directory because it reads `package.json` to find the binary path.

3. **Verify installation:**
   ```bash
   ddctl --help
   ```

### Usage

```bash
# Development mode (no build needed, uses ts-node)
npm run dev:cli list

# Production mode (uses compiled code)
ddctl list
```

**Events (failed recovery):** List failed sync events with `ddctl events list-failed`. Retry one with `ddctl events retry <eventId>` or all with `ddctl events retry-all`. Events are scoped by portal; the API (`GET /api/events/failed`, `POST /api/events/:id/retry`, `POST /api/events/retry-failed`) only lists and retries events for the portal of the API key.

**Note:** The CLI works from any directory because `DB_PATH` is resolved to an absolute path at startup.

## Environment Variables

Create a `.env` file in `config/` or `~/.fileverse/` with the following variables:

**Required:**

- `DB_PATH`: Database file path (required) - **Must be an absolute path**. Both API and CLI use the same database location.
  - **Examples:**
    - `DB_PATH=/Users/username/data/fileverse-api.db`
    - `DB_PATH=/absolute/path/to/fileverse-api.db`
  - **Important:**
    - Use absolute paths only (e.g., `/Users/username/data/fileverse-api.db`)
    - Relative paths will cause issues when running CLI from different directories
    - The directory will be created automatically if it doesn't exist
    - Both API server and CLI tool use the exact same database file

**Optional:**

- `PORT`: Server port (default: 8001)
- `IP`: Server IP (default: 127.0.0.1)
- `NODE_ENV`: Environment (development, production, etc.)
- `WORKER_CONCURRENCY`: Number of concurrent events to process (default: 5)
- `LOG_LEVEL`: Logging level - trace, debug, info, warn, error, fatal (default: info)
- `SERVICE_NAME`: Service name for logging (default: fileverse-api)

**Note:** The application will not start if `DB_PATH` is not set. Both the API server and CLI tool use the same database location specified by `DB_PATH`.
