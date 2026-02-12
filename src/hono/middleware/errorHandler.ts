import type { Context } from "hono";

export const errorHandler = (err: Error & { statusCode?: number; code?: number }, c: Context) => {
  const status = err.statusCode || err.code || 500;
  return c.json({ message: err.message }, status as any);
};
