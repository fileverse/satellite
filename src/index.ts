import { config } from './config';
import { logger } from './infra';
import { runMigrations } from './infra/database/migrations';
import { closeQueue } from './infra/queue';
import { closeDatabase } from './infra/database';
import app from './app';
import localtunnel = require('localtunnel');

runMigrations();

const port = parseInt(config.PORT || '8001', 10);
const ip = config.IP || '127.0.0.1';

let tunnel: Awaited<ReturnType<typeof localtunnel>> | undefined;

const server = app.listen(port, ip, async () => {
  logger.info(`🚀 Server ready at http://${ip}:${port}`);
  if (process.env.NODE_ENV === 'production') return;
  try {
    tunnel = await localtunnel({
      port,
      host: process.env.TUNNEL_HOST || undefined,
      subdomain: process.env.TUNNEL_SUBDOMAIN || undefined,
    });
    logger.info(`Tunnel ready at ${tunnel.url}`);
  } catch (error) {
    logger.error('Failed to start tunnel:', error);
  }
});

const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error?: Error) => (error ? reject(error) : resolve()));
    });
    logger.info('HTTP server closed');
  } catch (error) {
    logger.error('Error closing HTTP server:', error);
  }

  try {
    tunnel?.close();
    logger.info('Tunnel closed');
  } catch (error) {
    logger.error('Error closing tunnel:', error);
  }

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
