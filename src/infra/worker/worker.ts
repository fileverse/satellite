import { logger } from '../index';
import { processNextEvent } from './eventProcessor';

const DEFAULT_POLL_INTERVAL_MS = 2000;

let instance: FileEventsWorker | null = null;

/**
 * Worker that processes file events from the events table using recursive setTimeout.
 * Pulls one event at a time (by ascending timestamp), processes it, then waits before the next iteration.
 */
export class FileEventsWorker {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;
  private pollIntervalMs: number;

  constructor(pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS) {
    this.pollIntervalMs = pollIntervalMs;
  }

  start(pollIntervalMs?: number): void {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }
    if (pollIntervalMs !== undefined) {
      this.pollIntervalMs = pollIntervalMs;
    }
    this.isRunning = true;
    logger.info(`File events worker started (poll interval: ${this.pollIntervalMs}ms)`);
    this.run();
  }

  private run = (): void => {
    processNextEvent()
      .catch((err) => {
        logger.error('Worker error processing event:', err);
      })
      .finally(() => {
        if (this.isRunning) {
          this.timeoutId = setTimeout(this.run, this.pollIntervalMs);
        }
      });
  };

  async close(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    logger.info('Closing worker gracefully...');
    this.isRunning = false;
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    logger.info('Worker closed');
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

export function startWorker(
  pollIntervalMs: number = DEFAULT_POLL_INTERVAL_MS
): void {
  if (instance && instance.isActive()) {
    return;
  }
  instance = new FileEventsWorker(pollIntervalMs);
  instance.start();
}

export async function closeWorker(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}

export function isWorkerActive(): boolean {
  return instance !== null && instance.isActive();
}
