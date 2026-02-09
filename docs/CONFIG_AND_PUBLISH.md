# Configuration and Publish Flow

This document describes how network configuration and static constants work, and how the publish pipeline ensures production builds use the correct config without exposing developer credentials.

## Overview

Satellite uses two types of configuration:

1. **Network config** (static, build-time): API URL, server DID, network name, RPC URL, etc. — derived from JSON files and baked into the build.
2. **Runtime config** (env): API key, DB path, port overrides — loaded from `.env` at runtime (never published).

## Config Files

| File | Purpose |
|------|---------|
| `config/network.config.json` | Production network config. Used when building for publish. |
| `config/dev.network.config.json` | Development network config (gitignored). Used when running `dev` or `dev:worker`. |
| `config/dev.network.config.json.example` | Template for dev config. Copy to `dev.network.config.json` and customize. |

Both files share the same structure:

```json
{
  "API_URL": "https://...",
  "SERVER_DID": "did:key:...",
  "NETWORK_NAME": "sepolia",
  "DEFAULT_PORT": "8001",
  "DEFAULT_RPC_URL": "https://rpc.sepolia.org",
  "PIMLICO_PROXY_URL": "https://pimlico-proxy.fileverse.io",
  "SERVICE_NAME": "satellite",
  "LOG_LEVEL": "info",
  "FRONTEND_URL": "https://..."
}
```

`PIMLICO_PROXY_URL` is the Pimlico proxy service that authenticates with Satellite API keys and forwards bundler/paymaster requests to Pimlico. For local dev, use `http://localhost:8002` if running the proxy locally.

## Constants Generation

`STATIC_CONFIG` in `src/cli/constants.ts` is generated from one of the network config files. The script `scripts/generate-constants.cjs` reads the JSON and writes `src/cli/constants.generated.ts`.

**Generate manually:**

```bash
# Production config
node scripts/generate-constants.cjs config/network.config.json

# Dev config
node scripts/generate-constants.cjs config/dev.network.config.json
```

**Note:** `src/cli/constants.generated.ts` is gitignored and must not be committed.

## Flow Diagram

### Development Flow

```
npm run dev / npm run dev:worker
         │
         ▼
generate-constants config/dev.network.config.json
         │
         ▼
src/cli/constants.generated.ts (dev values)
         │
         ▼
tsx watch src/index.ts or src/worker.ts
```

### Publish Flow

```
npm publish (triggers prepublishOnly)
         │
         ▼
generate-constants config/network.config.json
         │
         ▼
npm run typecheck
         │
         ▼
npm run clean && npm run build
         │
         ▼
prebuild runs (generates constants again)
         │
         ▼
tsup compiles (dist/ with production STATIC_CONFIG)
         │
         ▼
npm packs (dist, public, package.json, README only)
```

## NPM Scripts

| Script | Description |
|--------|-------------|
| `generate:constants` | Generate constants (pass config path as arg: `npm run generate:constants -- config/network.config.json`) |
| `prebuild` | Runs before `build`. Generates from `network.config.json`. |
| `prepublishOnly` | Runs before `npm publish`. Generates prod config, typechecks, cleans, builds. |
| `dev` | Generates from `dev.network.config.json`, then starts API server with tsx watch. |
| `dev:worker` | Generates from `dev.network.config.json`, then starts worker with tsx watch. |
| `build` | Runs `prebuild` first, then tsup. |

## Published Package Contents

The published package (`npm pack`) includes only:

- `dist/` — compiled JavaScript
- `public/` — static assets
- `package.json`
- `README.md`

**Excluded from publish:**

- No `.env` or `config/.env.example` (avoids credential exposure)
- No `config/` directory (network config lives in source only)
- No `src/` (source not published)
- No `scripts/` (build scripts not needed by consumers)

## Runtime Configuration

End users configure the API via environment variables. The CLI scaffolds `~/.satellite/.env` when run with `fileverse-satellite`. Alternatively, users can create `config/.env` in the project root.

**Required at runtime:**

- `DB_PATH` — absolute path to SQLite database
- `API_KEY` — API key for authentication

**Optional:**

- `PORT`, `RPC_URL`, etc.

## First-Time Setup

1. Clone: `git clone <repo> && cd satellite && npm install`
2. Run `npm run dev` — generates `constants.generated.ts` and starts the server. If `dev.network.config.json` doesn't exist, it falls back to `network.config.json`.
3. For dev-specific config: `cp config/dev.network.config.json.example config/dev.network.config.json` and customize.
4. Or run `npm run build` — `prebuild` generates constants from prod config before building.

No `.env.example` exists; the CLI creates `~/.satellite/.env` when you run `fileverse-satellite` with your API key.

## Modifying Network Config

To change production config:

1. Edit `config/network.config.json`
2. Run `npm run build` (or `npm publish` — it will regenerate)

To change dev config:

1. Edit `config/dev.network.config.json`
2. Run `npm run dev` — it regenerates before starting
