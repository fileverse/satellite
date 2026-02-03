import IORedis from 'ioredis';

const DEFAULT_REDIS_URI = 'redis://localhost:6379';

export async function validateRedisConnection(
  redisUri?: string
): Promise<void> {
  const uri = redisUri || DEFAULT_REDIS_URI;

  const redis = new IORedis(uri, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    connectTimeout: 5000,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    await redis.ping();
    await redis.quit();
  } catch {
    await redis.disconnect();
    throw new Error(
      `Redis is required but not available at ${uri}

Please ensure Redis is running. You can start it with:
  - Docker: docker run -d -p 6379:6379 redis
  - macOS: brew services start redis
  - Linux: sudo systemctl start redis`
    );
  }
}
