import { WorkerManager } from './workerManager';
import { FILE_EVENTS_QUEUE } from './types';

let workerManager: WorkerManager | null = null;

export function startWorker(concurrency: number = 1): void {
  if (workerManager && workerManager.isActive()) {
    return;
  }
  
  workerManager = new WorkerManager(FILE_EVENTS_QUEUE);
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

