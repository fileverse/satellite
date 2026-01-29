import { Worker, Job } from 'bullmq';
import { logger } from '../index';
import { redisConnectionManager } from './connection';
import { FileEvent, FILE_EVENTS_QUEUE } from './types';
import { publishFile } from '../../domain/portal';
import type { FileService } from '../../domain/file/FileService';

export class WorkerManager {
  private worker: Worker<FileEvent> | null = null;
  private isRunning: boolean = false;

  constructor(
    private readonly fileServiceFactory: () => FileService,
    private readonly queueName: string = FILE_EVENTS_QUEUE,
  ) {}

  start(concurrency: number = 1): void {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }

    const connection = redisConnectionManager.getConnection();
    this.worker = new Worker<FileEvent>(
      this.queueName,
      this.processJob.bind(this),
      {
        connection,
        concurrency,
        removeOnComplete: {
          count: 100, // Keep last 100 completed jobs
          age: 24 * 3600, // Keep for 24 hours
        },
        removeOnFail: {
          count: 1000, // Keep last 1000 failed jobs
        },
      }
    );

    this.setupEventHandlers();
    this.isRunning = true;
    logger.info(`Worker started for queue: ${this.queueName} (concurrency: ${concurrency})`);
  }

  private async processJob(job: Job<FileEvent>): Promise<void> {
    const { fileId, type } = job.data;
    const fileSvc = this.fileServiceFactory();

    try {
      switch (type) {
        case 'create':
          await this.processCreateJob(job, fileSvc);
          break;
        case 'update':
          await this.processUpdateJob(job, fileSvc);
          break;
        case 'delete':
          await this.processDeleteJob(job, fileSvc);
          break;
        default:
          throw new Error(`Unknown event type: ${type}`);
      }
    } catch (error: any) {
      logger.error(`Error processing ${type} event for file ${fileId}:`, error);
      throw error;
    }
  }

  private async processCreateJob(job: Job<FileEvent>, fileSvc: FileService): Promise<void> {
    const { fileId, metadata } = job.data;

    const file = await fileSvc.getById(fileId);
    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    const result = await publishFile(fileId, fileSvc);
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    await fileSvc.updateSyncState(fileId, file.portalAddress, {
      onchainVersion: metadata.localVersion,
    });
    await fileSvc.updateSyncState(fileId, file.portalAddress, {
      syncStatus: 'synced',
    });
  }

  private async processUpdateJob(job: Job<FileEvent>, fileSvc: FileService): Promise<void> {
    const { fileId, metadata } = job.data;

    if (metadata.localVersion === undefined) {
      throw new Error('version field is required for update events');
    }

    const file = await fileSvc.getById(fileId);
    if (!file) {
      return;
    }

    if (metadata.localVersion < file.onchainVersion) {
      return;
    }

    const result = await publishFile(fileId, fileSvc);
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    await fileSvc.updateSyncState(fileId, file.portalAddress, {
      onchainVersion: metadata.localVersion,
    });
    await fileSvc.updateSyncState(fileId, file.portalAddress, {
      syncStatus: 'synced',
    });
  }

  private async processDeleteJob(job: Job<FileEvent>, fileSvc: FileService): Promise<void> {
    const { fileId } = job.data;

    const file = await fileSvc.getById(fileId);
    if (!file) {
      return;
    }

    const result = await publishFile(fileId, fileSvc);
    if (!result.success) {
      throw new Error(`Publish deletion failed for file ${fileId}`);
    }

    await fileSvc.updateSyncState(fileId, file.portalAddress, {
      syncStatus: 'synced',
    });
  }

  private setupEventHandlers(): void {
    if (!this.worker) return;

    this.worker.on('completed', (job) => {
      logger.info(`Job ${job.id} completed for file ${job.data.fileId}`);
    });

    this.worker.on('failed', (job, err) => {
      logger.error(`Job ${job?.id} failed for file ${job?.data.fileId}:`, err);
    });

    this.worker.on('error', (err) => {
      logger.error('Worker error:', err);
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn(`Job ${jobId} stalled`);
    });
  }

  async close(): Promise<void> {
    if (!this.worker || !this.isRunning) {
      return;
    }

    logger.info('Closing worker gracefully...');
    await this.worker.close();
    this.isRunning = false;
    logger.info('Worker closed');
  }

  isActive(): boolean {
    return this.isRunning && this.worker !== null;
  }

  getWorker(): Worker<FileEvent> | null {
    return this.worker;
  }
}

