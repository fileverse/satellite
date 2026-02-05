# Install the Satellite CLI

Install the dDocs Satellite CLI on your machine to run a local document server and manage ddocs from the command line.

The Satellite CLI lets you:

- Run a **local dDocs Satellite server** so all interactions stay on your device—your data never leaves your machine.
- Manage ddocs from the terminal (list, create, get, update, delete, download, view).

For more details, see the [API documentation](./api-documentation.md) and the main [README](../README.md).

---

## Install the Satellite CLI

You can install the package using **npx** (no install) or **global install** with npm.

### npx (recommended)

Run the latest version without installing:

```bash
npx @fileverse/satellite
```

Append a command to run the CLI, for example:

```bash
npx @fileverse/satellite list
```

### npm (global install)

To install the Satellite CLI globally:

```bash
npm install -g @fileverse/satellite
```

After a global install, run the package using the **binary name** in your terminal. Do not type `@fileverse/satellite` as a command—the `/` is treated as a path and the command will not be found. Use instead:

```bash
ddctl
```

Examples:

```bash
ddctl --help
ddctl list
```

---

## Run the local dDocs Satellite server

**Recommended if you are familiar with installing npm packages.**

1. **Install the package** (if you haven’t already):
   ```bash
   npm install -g @fileverse/satellite
   ```

2. **Start the local dDocs Satellite server** with your API key:
   ```bash
   ddctl --apikey="<prefilledAPIkey>"
   ```
   Replace `<prefilledAPIkey>` with the API key provided to you (e.g. from the portal or app).

3. Once the server is running, you can use the CLI from another terminal, or complete the in-app flow and click **“All done!”**.

---

## Run from source (development)

If you are working from the repository instead of the published package:

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd satellite
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp config/.env.example config/.env
   ```
   Edit `config/.env` and set at least `DB_PATH` (use an absolute path, e.g. `DB_PATH=/Users/you/data/satellite.db`).

3. **Build:**
   ```bash
   npm run clean && npm run build
   ```

4. **Run the API server** (local dDocs Satellite server):
   ```bash
   npm run start:api
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Use the CLI** (from project root):
   ```bash
   npm run dev:cli list
   ```
   Or after linking: `chmod +x dist/commands/index.js && npm link`, then from any directory:
   ```bash
   ddctl list
   ```

---

## Verify installation

After installing (globally or from source), confirm the CLI works:

```bash
ddctl --help
```

You should see the list of available commands (list, get, create, update, delete, download, view).

---

## Troubleshooting

| Issue | What to do |
|--------|------------|
| `@fileverse/satellite` not found after global install | Use the binary name `ddctl` instead of `@fileverse/satellite` in the terminal. |
| `DB_PATH` required / app won’t start | Set `DB_PATH` in `config/.env` to an absolute path (e.g. `/Users/you/data/satellite.db`). |
| CLI not found when using from source | Run `npm run clean && npm run build`, then `chmod +x dist/commands/index.js` and `npm link` from the project root. |
| Redis connection errors | Ensure Redis is running (e.g. `redis-cli ping`) and that `REDIS_URI` in `config/.env` is correct (default: `redis://localhost:6379`). |
