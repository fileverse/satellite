import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from '../index';

let redisClient: RedisClientType | null = null;

if (config.REDIS_URI) {
  redisClient = createClient({
    url: config.REDIS_URI,
  }) as RedisClientType;

  redisClient.on('error', (err: Error) => {
    logger.error('Redis Client Error', err);
  });

  redisClient.connect().catch(console.error);
}

export default redisClient;
export type { RedisClientType };
