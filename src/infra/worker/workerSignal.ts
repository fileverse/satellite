import { EventEmitter } from "events";

class WorkerSignal extends EventEmitter {}

const workerSignal = new WorkerSignal();
workerSignal.setMaxListeners(20);

export function notifyNewEvent(): void {
  workerSignal.emit("newEvent");
}

export function onNewEvent(callback: () => void): () => void {
  workerSignal.on("newEvent", callback);
  return () => workerSignal.off("newEvent", callback);
}
