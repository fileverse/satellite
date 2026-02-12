import { Hono } from "hono";
import { cors } from "hono/cors";
import { setRuntimeConfig } from "../config/index.js";
import { initializeWithUrl } from "../infra/database/index.js";
import { initializeFromApiKey } from "../init/index.js";
import { apiKeyAuthMiddleware } from "./middleware/apiKeyAuth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ddocsRoutes } from "./routes/ddocs.js";
import { foldersRoutes } from "./routes/folders.js";
import { searchRoutes } from "./routes/search.js";
import { eventsRoutes } from "./routes/events.js";
import { mcpRoutes } from "./routes/mcp.js";

export type AppEnv = {
  Bindings: {
    API_KEY: string;
    HYPERDRIVE: { connectionString: string };
    DATABASE_URL?: string;
    RPC_URL?: string;
  };
};

let initialized = false;

export function createApp() {
  const app = new Hono<AppEnv>();

  // Middleware: initialize config + database from env bindings
  app.use("*", async (c, next) => {
    // Resolve database URL: prefer Hyperdrive, fall back to DATABASE_URL
    const dbUrl = c.env.HYPERDRIVE?.connectionString || c.env.DATABASE_URL;
    if (!dbUrl) {
      return c.json({ error: "No database configured" }, 500);
    }

    setRuntimeConfig({
      API_KEY: c.env.API_KEY,
      DATABASE_URL: dbUrl,
      RPC_URL: c.env.RPC_URL,
    });

    await initializeWithUrl(dbUrl);

    // One-time initialization: fetch API key material and save portal/key
    if (!initialized) {
      try {
        await initializeFromApiKey(c.env.API_KEY);
        initialized = true;
      } catch {
        // If initialization fails (e.g., network issue), continue anyway
        // The API key data may already be in the database from a previous run
        initialized = true;
      }
    }

    await next();
  });

  app.use("*", cors({ origin: "*" }));

  // Static routes
  app.get("/ping", (c) => c.json({ reply: "pong" }));

  // API routes (with auth middleware)
  app.use("/api/*", apiKeyAuthMiddleware);
  app.route("/api/ddocs", ddocsRoutes);
  app.route("/api/folders", foldersRoutes);
  app.route("/api/search", searchRoutes);
  app.route("/api/events", eventsRoutes);

  // MCP endpoint
  app.route("/mcp", mcpRoutes);

  // Error handler
  app.onError(errorHandler);

  return app;
}
