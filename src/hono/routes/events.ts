import { Hono } from "hono";
import { EventsModel, ApiKeysModel } from "../../infra/database/models/index.js";
import type { AppEnv } from "../index.js";

const eventsRoutes = new Hono<AppEnv>();

// GET /failed - list failed events
eventsRoutes.get("/failed", async (c) => {
  const apiKey = c.req.query("apiKey");
  const apiKeyInfo = apiKey ? await ApiKeysModel.findByApiKey(apiKey) : null;
  const portalAddress = apiKeyInfo?.portalAddress;
  if (!portalAddress) {
    return c.json({ error: "Invalid or missing API key" }, 401);
  }
  const events = await EventsModel.listFailed(portalAddress);
  return c.json(events);
});

// POST /retry-failed - retry all failed events
eventsRoutes.post("/retry-failed", async (c) => {
  const apiKey = c.req.query("apiKey");
  const apiKeyInfo = apiKey ? await ApiKeysModel.findByApiKey(apiKey) : null;
  const portalAddress = apiKeyInfo?.portalAddress;
  if (!portalAddress) {
    return c.json({ error: "Invalid or missing API key" }, 401);
  }
  const count = await EventsModel.resetAllFailedToPending(portalAddress);
  return c.json({ retried: count });
});

// POST /:id/retry - retry single event
eventsRoutes.post("/:id/retry", async (c) => {
  const apiKey = c.req.query("apiKey");
  const apiKeyInfo = apiKey ? await ApiKeysModel.findByApiKey(apiKey) : null;
  const portalAddress = apiKeyInfo?.portalAddress;
  if (!portalAddress) {
    return c.json({ error: "Invalid or missing API key" }, 401);
  }
  const _id = c.req.param("id");
  const updated = await EventsModel.resetFailedToPending(_id, portalAddress);
  if (!updated) {
    return c.json({ error: "Event not found or not in failed state" }, 404);
  }
  return c.json({ ok: true });
});

export { eventsRoutes };
