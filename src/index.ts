import { config } from './config';
import { logger } from './infra/logger';
import app from './app';
import { runMigrations } from './infra/database/migrations';
import './infra/database'; // Initialize database connection

// Run migrations on application startup
runMigrations();

const port = parseInt(config.PORT || '8001', 10);
const ip = config.IP || '127.0.0.1';

app.listen(port, ip, () => {
  logger.info(`🚀 Server ready at http://${ip}:${port}`);
});

module.exports = app;
