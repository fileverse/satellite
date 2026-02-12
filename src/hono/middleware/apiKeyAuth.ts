import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../index.js";

export const apiKeyAuthMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  const apiKey = c.req.query("apiKey");
  if (!apiKey || apiKey !== c.env.API_KEY) {
    return c.json({ message: "Invalid or missing API key" }, 401);
  }
  await next();
});
