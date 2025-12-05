import mongoose from 'mongoose';
import { config } from '../config';
import { logger } from '../logger';

const dbURI = config.MONGOURI || 'mongodb://localhost/your-db';

mongoose.connect(dbURI).then(() => {
  logger.info('MongoDB Connected');
}).catch((err: Error) => {
  logger.error('DB Error: ', err);
  throw err;
});

export default mongoose;
