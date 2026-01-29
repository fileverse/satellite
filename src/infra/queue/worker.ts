import { WorkerManager } from './workerManager';
import { FILE_EVENTS_QUEUE } from './types';
import { QueueManager } from './queueManager';
import { databaseConnectionManager } from '../database/connection';
import { SqliteExecutor } from '../database/executor/SqliteExecutor';
import { FilesRepository } from '../database/repositories/FilesRepository';
import { FileService } from '../../domain/file/FileService';

let workerManager: WorkerManager | null = null;

/** Creates a fresh FileService for the current job (per-job scope, like req.context). */
// TODO: try to change this into a class based structure for consistency
function fileServiceFactoryFunc(): FileService {
  const db = databaseConnectionManager.getConnection();
  const executor = new SqliteExecutor(db);
  const filesRepository = new FilesRepository(executor);
  const fileEventsQueue = QueueManager.getInstance(FILE_EVENTS_QUEUE);
  return new FileService(filesRepository, fileEventsQueue);
}

export function startWorker(concurrency: number = 1): void {
  if (workerManager && workerManager.isActive()) {
    return;
  }

  // First arg: factory function (reference, not result). WorkerManager calls it per job to get a fresh FileService.
  // Second arg: queue name.
  workerManager = new WorkerManager(fileServiceFactoryFunc, FILE_EVENTS_QUEUE);
  workerManager.start(concurrency);
}

export async function closeWorker(): Promise<void> {
  if (workerManager) {
    await workerManager.close();
    workerManager = null;
  }
}

export function isWorkerActive(): boolean {
  return workerManager !== null && workerManager.isActive();
}

