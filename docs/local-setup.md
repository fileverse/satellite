---
title: Install on your local computer
date: 2026-02-09
---

# Install on your local computer

## Option 1. Using npx (no global installation)

Run the latest version without installing anything globally:

```plaintext
npx @fileverse/satellite
```

This would start the satellite server on port `8001`.  
You should be able to make API requests to create and manage documents.

## Option 2. Global npm install

Run the following command to install the package globally on your system.

```bash
npm install -g @fileverse/satellite
```

This makes two commands available on your system:
- `satellite` — Start and run the Satellite server
- `ddctl` — CLI tool to manage documents from the command line

To verify the installation, run:

```bash
satellite --help # or -h
ddctl --help
```

If the installation was successful, you should see help output for both commands with a list of available options.

### Available tools

When you install `@fileverse/satellite`, you get access to two command-line tools:

1. **`satellite`** — Starts and runs the Satellite server (API + worker). This is the main server that handles document management via REST API.

2. **`ddctl`** — A CLI tool for managing documents directly from your terminal. Use `ddctl` to create, list, view, update, and delete documents without making HTTP requests. Run `ddctl --help` to see all available commands.

### Running the server

To run the server, execute the following command in your terminal:

```bash
satellite \
  --apiKey <YOUR_FILEVERSE_API_KEY> \
  --pimlicoApiKey <YOUR_PIMLICO_API_KEY> \
  --rpcUrl <RPC_ENDPOINT> \
  --port <PORT_NUMBER> \
  --db <DB_PATH>
```

You can also run the command without any flags, in which case the program will prompt you for the mandatory variables such as `apiKey`, `pimlicoApiKey` and `rpcUrl` and the rest will fallback to sensible defaults as shown below.

* Default DB\_PATH: `$HOME/.satellite/satellite.db`
* Default PORT: `8001`

Once the required values are provided, Satellite will start the local server in your terminal. You can then make API requests to create and manage documents.

* * *

## FAQ

### 1\. What does Satellite install on my machine?

Satellite runs as a lightweight background service on your computer. It starts a local HTTP server and stores minimal configuration needed to manage your documents. It does not modify system files or interfere with existing applications.

### 2\. Does Satellite run all the time?

No. Satellite runs only while it is actively started.  
When you run `satellite`, it runs in the foreground and remains active as long as the terminal session is open.

You can stop it at any time (for example, by pressing `Ctrl+C`). Your documents remain intact, and everything resumes normally the next time you start Satellite.

To keep Satellite running continuously, you’ll need to keep the process running or deploy it using a cloud or managed setup.

### 3\. What data does Satellite have access to?

Only the text you explicitly send to Satellite is processed. Satellite does not scan your files, monitor activity, or access your system without your instruction.

### 4\. Is my data private?

Yes. Documents are encrypted before being published. Satellite is self-hosted by default, which means you control where it runs and what data it handles.

### 5\. Do I need an account or login to use Satellite locally?

No account is required to run Satellite locally. Some features (like publishing or syncing) may require an API key, which you generate and control from the Default API Space in your dDoc account.

### 6\. Does Satellite work offline?

You can create and manage documents locally while offline. Publishing or syncing requires an internet connection.

### 7\. Does Satellite store my data anywhere?

Yes. Satellite stores your documents (title, content, and metadata) in a local SQLite database on your machine. This ensures your data stays on your computer and is not uploaded elsewhere by default.

By default, the database is created at `$HOME/.satellite/satellite.db`.

```plaintext
$HOME/.satellite/satellite.db
```

You can customize the database location using the `--db` flag when starting Satellite:

```plaintext
satellite --db <YOUR_DB_PATH>/<YOUR_DB_NAME>.db
```

For example:
```plaintext
satellite --db /path/to/my/satellite.db
```

### 8\. What ports does Satellite use? Can I change them?

Satellite runs a local HTTP server on a configurable port. The default port is `8001`, and you can change it if it conflicts with something on your system.

To run the server on a different port, run

```plaintext
satellite --port <YOUR_PORT_NUMBER>
```

### 9\. Is Satellite safe to use on a work machine?

Satellite is designed to be minimally invasive and transparent. It runs locally, does not require elevated privileges, and only processes data you explicitly send to it.

### 10\. I’ve installed the package, but running `satellite` shows “command not found”

This usually means the directory where npm installs global command-line executables is not included in your `$PATH`. First, find out where npm installs global executables on your system by running:

```plaintext
npm config get prefix
```

Ensure the `bin` subdirectory of the output directory is included in your PATH. For example, if the command outputs `/usr/local`, then `/usr/local/bin` should be in your PATH.

After updating your `$PATH`, restart your terminal and run `satellite` again.
