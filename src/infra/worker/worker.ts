import { logger } from '../index';
import { processEvent } from './eventProcessor';
import { onNewEvent } from './workerSignal';
import { EventsModel } from '../database/models';
import type { Event } from '../database/models';

const DEFAULT_CONCURRENCY = 5;
const STALE_THRESHOLD_MS = 5 * 60 * 1000;
const SIGNAL_RETRY_DELAY_MS = 50;
const FALLBACK_POLL_MS = 30000;
const MAX_RETRIES = 3;

let instance: FileEventsWorker | null = null;

export class FileEventsWorker {
  private isRunning = false;
  private concurrency: number;
  private activeProcessors = new Map<string, Promise<void>>();
  private signalCleanup: (() => void) | null = null;
  private pendingSignal = false;
  private wakeResolver: (() => void) | null = null;

  constructor(concurrency: number = DEFAULT_CONCURRENCY) {
    this.concurrency = concurrency;
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Worker is already running');
      return;
    }
    this.isRunning = true;

    const staleCount = this.recoverStaleEvents();
    if (staleCount > 0) {
      logger.info(`Recovered ${staleCount} stale event(s)`);
    }

    this.signalCleanup = onNewEvent(() => {
      this.pendingSignal = true;
      this.wakeUp();
    });

    logger.info(
      `File events worker started (concurrency: ${this.concurrency})`
    );
    this.run();
  }

  private async run(): Promise<void> {
    while (this.isRunning) {
      const foundEvents = await this.fillSlots();
      logger.info(`Found ${foundEvents ? 'events' : 'no events'} to process`);
      if (this.activeProcessors.size === 0) {
        if (this.pendingSignal && !foundEvents) {
          this.pendingSignal = false;
          await this.sleep(SIGNAL_RETRY_DELAY_MS);
          continue;
        }

        this.pendingSignal = false;
        await this.waitForSignalOrTimeout(FALLBACK_POLL_MS);
      } else {
        await Promise.race(this.activeProcessors.values());
      }
    }
  }

  private async fillSlots(): Promise<boolean> {
    let foundAny = false;

    while (this.activeProcessors.size < this.concurrency && this.isRunning) {
      const lockedFileIds = Array.from(this.activeProcessors.keys());
      const event = EventsModel.findNextEligible(lockedFileIds);

      if (!event) break;

      foundAny = true;
      EventsModel.markProcessing(event._id);
      const processor = this.processEventWrapper(event);
      this.activeProcessors.set(event.fileId, processor);
    }

    logger.info(`Slots filled: ${this.activeProcessors.size}`);
    return foundAny;
  }

  private async processEventWrapper(event: Event): Promise<void> {
    try {
      const result = await processEvent(event);
      if (result.success) {
        EventsModel.markProcessed(event._id);
      } else {
        this.handleFailure(event, result.error);
      }
    } catch (err) {
      this.handleFailure(event, err);
    } finally {
      this.activeProcessors.delete(event.fileId);
    }
  }

  private handleFailure(event: Event, error: unknown): void {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (event.retryCount < MAX_RETRIES) {
      EventsModel.scheduleRetry(event._id, errorMsg);
      logger.warn(
        `Event ${event._id} failed (retry ${event.retryCount + 1}/${MAX_RETRIES}): ${errorMsg}`
      );
    } else {
      EventsModel.markFailed(event._id, errorMsg);
      logger.error(
        `Event ${event._id} permanently failed after ${MAX_RETRIES} retries: ${errorMsg}`
      );
    }
  }

  private recoverStaleEvents(): number {
    const staleThreshold = Date.now() - STALE_THRESHOLD_MS;
    return EventsModel.resetStaleEvents(staleThreshold);
  }

  private wakeUp(): void {
    if (this.wakeResolver) {
      this.wakeResolver();
      this.wakeResolver = null;
    }
  }

  private waitForSignalOrTimeout(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.wakeResolver = null;
        resolve();
      }, ms);

      this.wakeResolver = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    logger.info('Closing worker gracefully...');
    this.isRunning = false;

    if (this.signalCleanup) {
      this.signalCleanup();
      this.signalCleanup = null;
    }

    this.wakeUp();

    if (this.activeProcessors.size > 0) {
      logger.info(
        `Waiting for ${this.activeProcessors.size} active processor(s) to complete...`
      );
      await Promise.all(this.activeProcessors.values());
    }

    logger.info('Worker closed');
  }

  isActive(): boolean {
    return this.isRunning;
  }

  getActiveCount(): number {
    return this.activeProcessors.size;
  }
}

export function startWorker(concurrency: number = DEFAULT_CONCURRENCY): void {
  if (instance && instance.isActive()) {
    return;
  }
  instance = new FileEventsWorker(concurrency);
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

export function getWorkerActiveCount(): number {
  return instance ? instance.getActiveCount() : 0;
}
