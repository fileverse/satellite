import { Worker, Job } from 'bullmq';
import { logger } from '../index';
import { redisConnectionManager } from './connection';
import { FileEvent, FILE_EVENTS_QUEUE } from './types';
import { publishFile } from '../../domain/portal';
import { FilesModel } from '../database/models';
import { UpdateFilePayload } from '../database/models/files/types';

export class WorkerManager {
  private worker: Worker<FileEvent> | null = null;
  private queueName: string;
  private isRunning: boolean = false;

  constructor(queueName: string = FILE_EVENTS_QUEUE) {
    this.queueName = queueName;
  }

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

    try {
      switch (type) {
        case 'create':
          await this.processCreateJob(job);
          break;
        case 'update':
          await this.processUpdateJob(job);
          break;
        case 'delete':
          await this.processDeleteJob(job);
          break;
        default:
          throw new Error(`Unknown event type: ${type}`);
      }
    } catch (error: any) {
      logger.error(`Error processing ${type} event for file ${fileId}:`, error);
      throw error;
    }
  }

  private async processCreateJob(job: Job<FileEvent>): Promise<void> {
    const { fileId, metadata } = job.data;

    // file was created and saved in local db. 
    // we need to publish this file now
    const result = await publishFile(fileId);
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }


    // If publishing is successful, the local and onchain versions of the file are in sync
    // Hence, set onchainVersion = localVersion
    //
    // As of now, syncStatus is set to 'pending' in local db (default value upon file creation)
    const payload: UpdateFilePayload = {
      onchainVersion: metadata.localVersion,
    }
    const updatedFile = FilesModel.update(fileId, payload);

    // Once local and onchain versions become same, update syncStatus to 'synced' (from 'pending')
    if (updatedFile.localVersion === updatedFile.onchainVersion) {
      const payload: UpdateFilePayload = {
        syncStatus: 'synced', // TODO: use enum later
      }
      FilesModel.update(fileId, payload);
    }
  }

  private async processUpdateJob(job: Job<FileEvent>): Promise<void> {
    const { fileId, metadata } = job.data;

    if (metadata.localVersion === undefined) {
      // TODO: should we throw error here, or fail silently by returning? Think!
      throw new Error('version field is required for update events');
    }

    const file = FilesModel.findById(fileId);
    if (!file) {
      return;
    }

    // Ignore out-of-order event
    if (metadata.localVersion < file.onchainVersion) {
      return;
    }

    const result = await publishFile(fileId);
    if (!result.success) {
      throw new Error(`Publish failed for file ${fileId}`);
    }

    // If publishing is successful, the local and onchain versions of the file are in sync
    // Hence, set onchainVersion = localVersion
    //
    // As of now, syncStatus is set to 'pending' in local db
    const payload: UpdateFilePayload = {
      onchainVersion: metadata.localVersion,
    }
    const updatedFile = FilesModel.update(fileId, payload);

    // Once local and onchain versions become same, update syncStatus to 'synced' (from 'pending')
    if (updatedFile.localVersion === updatedFile.onchainVersion) {
      const payload: UpdateFilePayload = {
        syncStatus: 'synced', // TODO: use enum later
      }
      FilesModel.update(fileId, payload);
    }
  }

  private async processDeleteJob(job: Job<FileEvent>): Promise<void> {
    const { fileId, metadata } = job.data;

    // Get the file including deleted ones to get its version
    const file = FilesModel.findByIdIncludingDeleted(fileId);
    if (!file) {
      return;
    }

    const result = await publishFile(fileId);
    if (!result.success) {
      throw new Error(`Publish deletion failed for file ${fileId}`);
    }

    // For deletion, no comparison between local and onchain version is needed.
    // File is already marked as deleted in local db, here we just update the syncStatus to 'synced' (from 'pending')
    const payload: UpdateFilePayload = {
      syncStatus: 'synced',
    }
    FilesModel.update(fileId, payload);
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

