import { Queue, JobsOptions } from 'bullmq';
import { logger } from '../index';
import { redisConnectionManager } from './connection';
import { FileEvent, FILE_EVENTS_QUEUE } from './types';

export class QueueManager {
  private static instances: Map<string, QueueManager> = new Map();
  private queue: Queue<FileEvent>;

  private constructor(queueName: string) {
    const connection = redisConnectionManager.getConnection();
    this.queue = new Queue<FileEvent>(queueName, { connection });
    this.setupEventHandlers();
  }

  static getInstance(queueName: string = FILE_EVENTS_QUEUE): QueueManager {
    if (!QueueManager.instances.has(queueName)) {
      QueueManager.instances.set(queueName, new QueueManager(queueName));
    }
    return QueueManager.instances.get(queueName)!;
  }

  private setupEventHandlers(): void {
    this.queue.on('error', (error) => {
      logger.error('Queue error:', error);
    });

    this.queue.on('waiting', (job) => {
      logger.debug(`Job ${job.id} is waiting`);
    });
  }

  // TODO: can we remove the try-catch here?
  async addJob(event: FileEvent, options?: JobsOptions): Promise<void> {
    try {
      await this.queue.add(event.type, event, options);
      logger.info(`Added file event job: ${event.type} for file ${event.fileId}`);
    } catch (error: any) {
      logger.error(`Failed to add event job to queue:`, error);
      throw error;
    }
  }

  async getStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  async close(): Promise<void> {
    await this.queue.close();
  }

  getQueue(): Queue<FileEvent> {
    return this.queue;
  }
}

