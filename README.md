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

## Environment Variables

Create a `.env` file in the `config/` directory with the following variables:

- `PORT`: Server port (default: 8001)
- `IP`: Server IP (default: 127.0.0.1)
- `REDIS_URI`: Redis connection string (required for BullMQ, default: redis://localhost:6379)
- `NODE_ENV`: Environment (development, production, etc.)
- `SYNC_WORKER_CONCURRENCY`: Number of concurrent sync jobs to process (default: 5)
- `SYNC_WORKER_MAX_JOBS`: Maximum jobs per second (default: 10)
