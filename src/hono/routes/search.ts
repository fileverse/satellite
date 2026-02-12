import { Hono } from "hono";
import { searchNodes } from "../../domain/search/index.js";
import { getRuntimeConfig } from "../../config/index.js";
import { ApiKeysModel } from "../../infra/database/models/index.js";
import type { AppEnv } from "../index.js";

const searchRoutes = new Hono<AppEnv>();

// GET / - search documents
searchRoutes.get("/", async (c) => {
  const query = c.req.query("q");
  const limit = c.req.query("limit") ? parseInt(c.req.query("limit")!, 10) : undefined;
  const skip = c.req.query("skip") ? parseInt(c.req.query("skip")!, 10) : undefined;

  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) throw new Error("API key is required");

  const apiKeyInfo = await ApiKeysModel.findByApiKey(apiKey);
  const portalAddress = apiKeyInfo?.portalAddress as string;
  if (!portalAddress) throw new Error("Portal address is required");

  if (!query) {
    return c.json({ error: 'Query parameter "q" is required' }, 400);
  }

  const result = await searchNodes({ query, limit, skip, portalAddress });
  return c.json({
    nodes: result.nodes,
    total: result.total,
    hasNext: result.hasNext,
  });
});

export { searchRoutes };
