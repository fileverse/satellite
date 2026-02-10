import { createWorker, type FileEventsWorker } from "./infra/worker";

const DEFAULT_CONCURRENCY = 5;

let worker: FileEventsWorker | null = null;

export function startWorker(concurrency: number = DEFAULT_CONCURRENCY): void {
  if (worker?.isActive()) {
    return;
  }
  worker = createWorker(concurrency);
  worker.start();
}

export async function closeWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
  }
}

export function isWorkerActive(): boolean {
  return worker?.isActive() ?? false;
}

export function getWorkerActiveCount(): number {
  return worker?.getActiveCount() ?? 0;
}
