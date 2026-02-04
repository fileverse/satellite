import fs from 'fs';
import path from 'path';
import os from 'os';
import { STATIC_CONFIG } from './constants';

export interface ConfigOptions {
  apiKey?: string;
  dbPath?: string;
  redisUri?: string;
  port?: string;
  rpcUrl?: string;
  pimlicoApiKey?: string;
}

export function getSatelliteDir(): string {
  return path.join(os.homedir(), '.satellite');
}

function getDefaultDbPath(): string {
  return path.join(getSatelliteDir(), 'satellite.db');
}

export function getEnvPath(): string {
  return path.join(getSatelliteDir(), '.env');
}

export function scaffoldConfig(options: ConfigOptions = {}): string {
  const satelliteDir = getSatelliteDir();
  const envPath = getEnvPath();

  if (!fs.existsSync(satelliteDir)) {
    fs.mkdirSync(satelliteDir, { recursive: true });
  }

  const dbPath = options.dbPath || getDefaultDbPath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const envContent = `API_KEY=${options.apiKey}
PIMLICO_API_KEY=${options.pimlicoApiKey}
RPC_URL=${options.rpcUrl || STATIC_CONFIG.DEFAULT_RPC_URL}
DB_PATH=${dbPath}
REDIS_URI=${options.redisUri || STATIC_CONFIG.DEFAULT_REDIS_URI}
PORT=${options.port || STATIC_CONFIG.DEFAULT_PORT}
`;

  fs.writeFileSync(envPath, envContent, 'utf-8');

  return envPath;
}

export function configExists(): boolean {
  return fs.existsSync(getEnvPath());
}
