import redisClient, { RedisClientType } from './redis';

class Cache {
  redisClient: RedisClientType | null;

  constructor() {
    this.redisClient = redisClient;
  }

  // Add your cache methods here
}

export default new Cache();
