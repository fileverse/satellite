import bunyan from 'bunyan';
import { config } from '../config';

export const logger = bunyan.createLogger({
  name: config.SERVICE_NAME as string,
  level: (config.LOG_LEVEL as bunyan.LogLevel) || 'info',
  streams: [
    {
      stream: process.stdout,
    },
  ],
});
