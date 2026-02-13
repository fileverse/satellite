import { config, validateDbConfig } from "./config";
import { logger } from "./infra";
import { runMigrations } from "./infra/database/migrations";
import { closeWorker, startWorker } from "./appWorker";
import { closeDatabase } from "./infra/database";
import { initializeFromApiKey } from "./init";
import app from "./app";
import { createMcpRouter } from "./mcp/http.js";
import { join } from "path";

const port = parseInt(config.PORT || "8001", 10);
const ip = config.IP || "0.0.0.0";

let server: ReturnType<typeof app.listen>;

const startServer = async (): Promise<void> => {
  validateDbConfig();
  await runMigrations();

  const apiKey = config.API_KEY;
  if (!apiKey) {
    logger.error("API_KEY environment variable is not set");
    process.exit(1);
  }

  if (process.env.IS_CLI !== "1") {
    logger.debug("Initializing server with API key...");
    await initializeFromApiKey(apiKey);
  }
  logger.info("Server initialization complete");

  if (process.env.INLINE_WORKER === "true") {
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY || "5", 10);
    await startWorker(concurrency);
    logger.info("Inline worker started");
  }

  // Rewrite MCP requests from root to /mcp for base URL compatibility
  app.use((req, _res, next) => {
    console.log("rewriting", req.method, req.path, req.body);
    if (req.method === "POST" && req.path === "/" && req.body?.jsonrpc) {
      req.url = "/mcp";
    }

    if (req.method === "GET" && req.path === "/") {
      return _res.sendFile(join(__dirname, "../public/llm.txt"));
    }
    next();
  });

  app.use("/mcp", createMcpRouter({ serverUrl: `http://localhost:${port}`, apiKey }));
  logger.info("MCP HTTP transport mounted at /mcp");

  server = app.listen(port, ip, async () => {
    logger.info(`🚀 Server ready at http://${ip}:${port}`);
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});

const shutdown = async () => {
  logger.info("Shutting down gracefully...");

  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => (error ? reject(error) : resolve()));
      });
      logger.info("HTTP server closed");
    } catch (error) {
      logger.error("Error closing HTTP server:", error);
    }
  }

  try {
    await closeWorker();
    logger.info("Worker closed");
  } catch (error) {
    logger.error("Error closing worker:", error);
  }

  try {
    await closeDatabase();
    logger.info("Database connection closed");
  } catch (error) {
    logger.error("Error closing database:", error);
  }

  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
