import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import os from "os";
import { STATIC_CONFIG } from "../cli/constants.js";

const projectEnvPath = path.join(process.cwd(), "config", ".env");
const userEnvPath = path.join(os.homedir(), ".fileverse", ".env");

function getEnvPath(): string {
  if (fs.existsSync(projectEnvPath)) {
    return projectEnvPath;
  }
  return userEnvPath;
}

export function loadConfig(override = true): void {
  const envPath = getEnvPath();
  dotenv.config({ path: envPath, override });
}

loadConfig(false);

export function getRuntimeConfig() {
  return {
    get API_KEY() {
      return process.env.API_KEY;
    },
    get RPC_URL() {
      return process.env.RPC_URL || STATIC_CONFIG.DEFAULT_RPC_URL;
    },
    get DB_PATH() {
      return process.env.DB_PATH;
    },
    get DATABASE_URL() {
      return process.env.DATABASE_URL;
    },
    get PORT() {
      return process.env.PORT || STATIC_CONFIG.DEFAULT_PORT;
    },
    get NODE_ENV() {
      return process.env.NODE_ENV || "production";
    },
    get FRONTEND_URL() {
      return process.env.FRONTEND_URL || STATIC_CONFIG.FRONTEND_URL;
    },
  };
}

export function validateDbConfig(): void {
  const databaseUrl = process.env.DATABASE_URL;
  const dbPath = process.env.DB_PATH;

  // If DATABASE_URL is set, skip file path validation (PostgreSQL mode)
  if (databaseUrl) {
    return;
  }

  if (!dbPath) {
    console.error("Error: DB_PATH or DATABASE_URL environment variable is required");
    console.error("Please set DB_PATH or DATABASE_URL in your .env file (config/.env or ~/.fileverse/.env) or run the CLI first");
    process.exit(1);
  }

  const dbDir = path.dirname(dbPath.trim());
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

// Keep backwards-compatible alias
export const validateDbPath = validateDbConfig;

const config: Record<string, string | undefined> = {
  ...STATIC_CONFIG,
  get SERVICE_NAME() {
    return STATIC_CONFIG.SERVICE_NAME;
  },
  get LOG_LEVEL() {
    return STATIC_CONFIG.LOG_LEVEL;
  },
  get NETWORK_NAME() {
    return STATIC_CONFIG.NETWORK_NAME;
  },
  get UPLOAD_SERVER_URL() {
    return STATIC_CONFIG.API_URL;
  },
  get UPLOAD_SERVER_DID() {
    return STATIC_CONFIG.SERVER_DID;
  },
  get API_KEY() {
    return process.env.API_KEY;
  },
  get RPC_URL() {
    return process.env.RPC_URL || STATIC_CONFIG.DEFAULT_RPC_URL;
  },
  get DB_PATH() {
    return process.env.DB_PATH;
  },
  get DATABASE_URL() {
    return process.env.DATABASE_URL;
  },
  get PORT() {
    return process.env.PORT || STATIC_CONFIG.DEFAULT_PORT;
  },
  get NODE_ENV() {
    return process.env.NODE_ENV || "production";
  },
  get IP() {
    return process.env.IP || "0.0.0.0";
  },
  get FRONTEND_URL() {
    return process.env.FRONTEND_URL || STATIC_CONFIG.FRONTEND_URL;
  },
};

export { config };
