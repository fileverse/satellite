import fs from "fs";
import path from "path";
import os from "os";
import { STATIC_CONFIG } from "./constants";
import type { ConfigOptions } from "../types";

export function getFileverseDir(): string {
  return path.join(os.homedir(), ".fileverse");
}

function getDefaultDbPath(): string {
  return path.join(getFileverseDir(), "fileverse-api.db");
}

export function getEnvPath(): string {
  return path.join(getFileverseDir(), ".env");
}

export function scaffoldConfig(options: ConfigOptions = {}): string {
  const fileverseDir = getFileverseDir();
  const envPath = getEnvPath();

  if (!fs.existsSync(fileverseDir)) {
    fs.mkdirSync(fileverseDir, { recursive: true });
  }

  const dbPath = options.dbPath || getDefaultDbPath();
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const envContent = `API_KEY=${options.apiKey}
RPC_URL=${options.rpcUrl || STATIC_CONFIG.DEFAULT_RPC_URL}
DB_PATH=${dbPath}
PORT=${options.port || STATIC_CONFIG.DEFAULT_PORT}
`;

  fs.writeFileSync(envPath, envContent, "utf-8");

  return envPath;
}
