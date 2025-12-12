import IORedis, { RedisOptions } from 'ioredis';
import { config } from '../../config';
import { logger } from '../index';

/**
 * Redis connection manager - Singleton pattern
 * Provides a shared Redis connection for both Queue and Worker instances
 */
class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private connection: IORedis | null = null;

  private constructor() {}

  static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  getConnection(options?: RedisOptions): IORedis {
    if (!this.connection) {
      const defaultOptions: RedisOptions = {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        ...options,
      };

      this.connection = new IORedis(
        config.REDIS_URI || 'redis://localhost:6379',
        defaultOptions
      );

      this.setupEventHandlers();
    }

    return this.connection;
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    this.connection.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    this.connection.on('connect', () => {
      logger.info('Redis connection established');
    });

    this.connection.on('ready', () => {
      logger.info('Redis connection ready');
    });

    this.connection.on('close', () => {
      logger.warn('Redis connection closed');
    });
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }

  isConnected(): boolean {
    return this.connection?.status === 'ready';
  }
}

export const redisConnectionManager = RedisConnectionManager.getInstance();

