import { config, validateDbPath } from './config';
import { logger } from './infra';
import { runMigrations } from './infra/database/migrations';
import { closeWorker, startWorker } from './infra/worker';
import { closeDatabase } from './infra/database';
import { initializeFromApiKey } from './init';
import app from './app';

const port = parseInt(config.PORT || '8001', 10);
const ip = config.IP || '0.0.0.0';

let server: ReturnType<typeof app.listen>;

async function startServer() {
  validateDbPath();
  runMigrations();

  const apiKey = config.API_KEY;
  if (!apiKey) {
    logger.error('API_KEY environment variable is not set');
    process.exit(1);
  }

  logger.info('Initializing server with API key...');
  await initializeFromApiKey(apiKey);
  logger.info('Server initialization complete');

  if (process.env.INLINE_WORKER === 'true') {
    const concurrency = parseInt(process.env.WORKER_CONCURRENCY || '5', 10);
    startWorker(concurrency);
    logger.info('Inline worker started');
  }

  server = app.listen(port, ip, async () => {
    logger.info(`🚀 Server ready at http://${ip}:${port}`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  if (server) {
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error?: Error) => (error ? reject(error) : resolve()));
      });
      logger.info('HTTP server closed');
    } catch (error) {
      logger.error('Error closing HTTP server:', error);
    }
  }

  try {
    await closeWorker();
    logger.info('Worker closed');
  } catch (error) {
    logger.error('Error closing worker:', error);
  }

  try {
    await closeDatabase();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database:', error);
  }

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
