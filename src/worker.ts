import { validateDbPath } from './config';
import { logger } from './infra';
import { runMigrations } from './infra/database/migrations';
import { closeWorker, isWorkerActive, startWorker } from './infra/worker';

validateDbPath();
runMigrations();

const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
startWorker(concurrency);

setTimeout(() => {
  if (isWorkerActive()) {
    logger.info('File events worker started and active');
    return;
  }

  logger.error('Worker failed to start');
  process.exit(1);
}, 100);

const shutdown = async () => {
  logger.info('Shutting down worker gracefully...');
  await closeWorker();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
