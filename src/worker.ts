import { logger } from './infra';
import { closeWorker, isWorkerActive, startWorker } from './infra/queue';

const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '1', 10);
startWorker(concurrency);

setTimeout(() => {
  if (isWorkerActive()) {
    logger.info('BullMQ Worker started and active');
    return;
  } 
  
  logger.error('BullMQ Worker failed to start');
  process.exit(1);
}, 100);

const shutdown = async () => {
  logger.info('Shutting down worker gracefully...');
  await closeWorker();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
