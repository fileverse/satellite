import { config } from './config';
import { logger } from './infra';
import { runMigrations } from './infra/database/migrations';
import { closeQueue } from './infra/queue';
import { closeDatabase } from './infra/database';
import app from './app';

runMigrations();

const port = parseInt(config.PORT || '8001', 10);
const ip = config.IP || '127.0.0.1';

app.listen(port, ip, () => {
  logger.info(`🚀 Server ready at http://${ip}:${port}`);
});

const shutdown = async () => {
  logger.info('Shutting down gracefully...');
  try {
    await closeQueue();
    logger.info('Queue connections closed');
  } catch (error) {
    logger.error('Error closing queue:', error);
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

module.exports = app;
