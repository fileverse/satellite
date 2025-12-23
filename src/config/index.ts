import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from config/ directory (relative to project root)
// Works in both dev (src/config) and prod (dist/config)
const envPath = path.resolve(__dirname, '../../config/.env');
dotenv.config({ path: envPath });

const config = process.env;

config.SERVICE_NAME = config.SERVICE_NAME || 'satellite';

if (!config.DB_PATH) {
  console.error('Error: DB_PATH environment variable is required');
  console.error('Please set DB_PATH in your .env file (config/.env) or environment variables');
  process.exit(1);
}

const dbPath = config.DB_PATH.trim();
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export { config };

