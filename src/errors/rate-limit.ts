import { HttpRequestError } from "viem";

export class RateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number, message = "Rate limit exceeded") {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

const MAX_RETRY_AFTER_SECONDS = 300;
const DEFAULT_RETRY_AFTER_SECONDS = 3600;

function parseRetryAfterRaw(raw: string | null): number {
  if (!raw) return DEFAULT_RETRY_AFTER_SECONDS;
  const parsed = parseInt(raw, 10);
  if (!Number.isNaN(parsed) && parsed >= 0) return Math.min(parsed, MAX_RETRY_AFTER_SECONDS);
  const date = Date.parse(raw);
  if (!Number.isNaN(date)) {
    const seconds = Math.max(0, Math.ceil((date - Date.now()) / 1000));
    return Math.min(seconds, MAX_RETRY_AFTER_SECONDS);
  }
  return DEFAULT_RETRY_AFTER_SECONDS;
}

export const parseRetryAfterSeconds = (response: Response): number =>
  parseRetryAfterRaw(response.headers.get("Retry-After"));

export const parseRetryAfterFromHeaders = (headers?: Headers): number =>
  parseRetryAfterRaw(headers?.get("Retry-After") ?? null);

export function normalizeRateLimitError(error: unknown): unknown {
  if (!(error instanceof HttpRequestError) || error.status !== 429) return error;
  const retryAfter = parseRetryAfterFromHeaders(error.headers);
  const message = "Beta API rate limit reached. Try again in an hour please!";
  return new RateLimitError(retryAfter, message);
}
