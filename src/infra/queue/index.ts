import { FileEvent } from './types';
import { redisConnectionManager } from './connection';
import { QueueManager } from './queueManager';
import { FILE_EVENTS_QUEUE } from './types';
import { closeWorker, isWorkerActive, startWorker } from './worker';

/**
 * Default queue manager instance for file events
 * Use this for adding jobs to the queue
 */
const fileEventsQueue = QueueManager.getInstance(FILE_EVENTS_QUEUE);

/**
 * Close all queue connections gracefully
 * Should be called during application shutdown
 */
async function closeQueue(): Promise<void> {
  await fileEventsQueue.close();
  await closeWorker(); // Close worker if it's running
  await redisConnectionManager.close();
}

export { FileEvent, fileEventsQueue, closeQueue, closeWorker, isWorkerActive, startWorker };