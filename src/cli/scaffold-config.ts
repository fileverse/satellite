import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

export interface ConfigOptions {
  apiKey?: string;
  dbPath?: string;
  redisUri?: string;
  port?: string;
  networkName?: string;
  rpcUrl?: string;
  pimlicoApiKey?: string;
}

const BASE_CONFIG = {
  PORT: '8001',
  NETWORK_NAME: 'sepolia',
  UPLOAD_SERVER_URL: 'https://sepolia-dsheet-storage-fc05499ecd15.herokuapp.com',
  SERVER_DID: "did:key:z6MkrrWQ11DoCzkLzoDuDnCszbwZZra3PmF62joDeMbpgCFD",
}

function getDefaultDbPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.satellite', 'satellite.db');
}

function getConfigDir(): string {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../../config');
}

export function scaffoldConfig(options: ConfigOptions = {}): string {
  const configDir = getConfigDir();
  const envPath = path.join(configDir, '.env');

  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }

  const dbPath = options.dbPath || getDefaultDbPath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }


  const envContent = `PORT=${options.port || BASE_CONFIG.PORT}
IP=127.0.0.1
DB_PATH=${dbPath}
REDIS_URI=${options.redisUri || 'redis://localhost:6379'}
NODE_ENV=production
SERVICE_NAME=satellite
LOG_LEVEL=info
NETWORK_NAME=${options.networkName || BASE_CONFIG.NETWORK_NAME}
RPC_URL=${options.rpcUrl}
UPLOAD_SERVER_URL=${BASE_CONFIG.UPLOAD_SERVER_URL}
PIMLICO_API_KEY=${options.pimlicoApiKey}
UPLOAD_SERVER_DID=${BASE_CONFIG.SERVER_DID}
API_KEY=${options.apiKey}
`;

  fs.writeFileSync(envPath, envContent, 'utf-8');

  return envPath;
}

export function configExists(): boolean {
  const envPath = path.join(getConfigDir(), '.env');
  return fs.existsSync(envPath);
}
