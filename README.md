# satellite

## Setup

```bash
git clone <your-repo-url>
cd satellite
# add proper env variables
cp config/.env.example config/.env
npm install
```

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

### Installation

After installing dependencies, the CLI is available via:

```bash
# Development mode
npm run dev:cli

# Production mode (after build)
ddctl
```

## Environment Variables

Create a `.env` file in the `config/` directory with the following variables:

**Required:**
- `DB_PATH`: Database file path (required) - Must be an absolute path. Both API and CLI use the same database location.
  - **Examples:**
    - `DB_PATH=/absolute/path/to/<db_name>.db`
  - **Note:** The directory will be created automatically if it doesn't exist.

**Optional:**
- `PORT`: Server port (default: 8001)
- `IP`: Server IP (default: 127.0.0.1)
- `REDIS_URI`: Redis connection string (required for BullMQ, default: redis://localhost:6379)
- `NODE_ENV`: Environment (development, production, etc.)
- `SYNC_WORKER_CONCURRENCY`: Number of concurrent sync jobs to process (default: 5)
- `SYNC_WORKER_MAX_JOBS`: Maximum jobs per second (default: 10)

**Note:** The application will not start if `DB_PATH` is not set. Both the API server and CLI tool use the same database location specified by `DB_PATH`.
