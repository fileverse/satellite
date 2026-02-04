import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

interface ManagedProcess {
  name: string;
  process: ChildProcess;
}

const managedProcesses: ManagedProcess[] = [];

function getDistDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '..');
}

function prefixOutput(name: string, data: Buffer): void {
  const lines = data.toString().split('\n').filter(Boolean);
  for (const line of lines) {
    console.log(`[${name}] ${line}`);
  }
}

function spawnProcess(name: string, scriptPath: string): ChildProcess {
  const child = spawn('node', [scriptPath], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'production' },
    detached: false,
  });

  child.stdout?.on('data', (data: Buffer) => prefixOutput(name, data));
  child.stderr?.on('data', (data: Buffer) => prefixOutput(name, data));

  child.on('error', (error) => {
    console.error(`[${name}] Process error:`, error.message);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`[${name}] Process terminated by signal ${signal}`);
    } else if (code !== 0) {
      console.error(`[${name}] Process exited with code ${code}`);
    }
  });

  managedProcesses.push({ name, process: child });
  return child;
}

export function startApiServer(): ChildProcess {
  const distDir = getDistDir();
  const apiPath = path.join(distDir, 'index.js');
  return spawnProcess('API', apiPath);
}

export function startWorker(): ChildProcess {
  const distDir = getDistDir();
  const workerPath = path.join(distDir, 'worker.js');
  return spawnProcess('WORKER', workerPath);
}

export function startAll(): { api: ChildProcess; worker: ChildProcess } {
  const api = startApiServer();
  const worker = startWorker();
  return { api, worker };
}

export function setupShutdownHandlers(): void {
  const shutdown = (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down...`);

    for (const { name, process: child } of managedProcesses) {
      if (child.pid && !child.killed) {
        console.log(`[${name}] Stopping...`);
        child.kill('SIGTERM');
      }
    }

    setTimeout(() => {
      for (const { name, process: child } of managedProcesses) {
        if (child.pid && !child.killed) {
          console.log(`[${name}] Force killing...`);
          child.kill('SIGKILL');
        }
      }
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export function waitForProcesses(): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const allExited = managedProcesses.every(
        ({ process: child }) => child.exitCode !== null || child.killed
      );
      if (allExited) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 1000);
  });
}
