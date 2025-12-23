# satellite

## Setup

```bash
git clone <your-repo-url>
cd satellite
npm install

# Configure environment variables
cp config/.env.example config/.env
# Edit config/.env and set DB_PATH (see Environment Variables section)
```

### Building the Project

**Important:** After installation or when making code changes, you must build the project:

```bash
# Clean old compiled code and rebuild
npm run clean && npm run build
```

**Why clean before build?**
- Ensures compiled code (`dist/`) matches your source code (`src/`)
- Prevents stale compiled code from causing errors
- Always run `npm run clean && npm run build` after:
  - Initial setup
  - Pulling new changes
  - Making significant code changes
  - Seeing errors that don't match your source code

## Run

### API Server
```bash
npm run start:api
```

### Worker (for processing sync jobs)
```bash
npm run start:worker
```

### Development
```bash
# Run API server
npm run dev

# Run worker in another terminal
npm run dev:worker
```

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

**Note:** The CLI works from any directory because `DB_PATH` is resolved to an absolute path at startup.

## Environment Variables

Create a `.env` file in the `config/` directory with the following variables:

**Required:**
- `DB_PATH`: Database file path (required) - **Must be an absolute path**. Both API and CLI use the same database location.
  - **Examples:**
    - `DB_PATH=/Users/username/data/satellite.db`
    - `DB_PATH=/absolute/path/to/satellite.db`
  - **Important:**
    - Use absolute paths only (e.g., `/Users/username/data/satellite.db`)
    - Relative paths will cause issues when running CLI from different directories
    - The directory will be created automatically if it doesn't exist
    - Both API server and CLI tool use the exact same database file

**Optional:**
- `PORT`: Server port (default: 8001)
- `IP`: Server IP (default: 127.0.0.1)
- `REDIS_URI`: Redis connection string (required for BullMQ, default: redis://localhost:6379)
- `NODE_ENV`: Environment (development, production, etc.)
- `SYNC_WORKER_CONCURRENCY`: Number of concurrent sync jobs to process (default: 5)
- `SYNC_WORKER_MAX_JOBS`: Maximum jobs per second (default: 10)

**Note:** The application will not start if `DB_PATH` is not set. Both the API server and CLI tool use the same database location specified by `DB_PATH`.
