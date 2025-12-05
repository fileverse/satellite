import dotenv from 'dotenv';

dotenv.config();
const config = process.env;

config.SERVICE_NAME = config.SERVICE_NAME || 'your-service-name';

export { config };

