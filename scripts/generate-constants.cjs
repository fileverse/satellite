const fs = require('fs');
const path = require('path');

const REQUIRED_KEYS = [
  'API_URL',
  'SERVER_DID',
  'PROXY_SERVER_DID',
  'NETWORK_NAME',
  'DEFAULT_PORT',
  'DEFAULT_RPC_URL',
  'PIMLICO_PROXY_URL',
  'SERVICE_NAME',
  'LOG_LEVEL',
  'FRONTEND_URL',
];

function main() {
  const configPath = process.argv[2];
  if (!configPath) {
    console.error('Usage: node scripts/generate-constants.cjs <config-path>');
    process.exit(1);
  }

  let absolutePath = path.resolve(process.cwd(), configPath);
  if (!fs.existsSync(absolutePath)) {
    const fallback = path.resolve(process.cwd(), 'config/network.config.json');
    if (configPath.includes('dev.network.config.json') && fs.existsSync(fallback)) {
      absolutePath = fallback;
    } else {
      console.error(`Config file not found: ${absolutePath}`);
      process.exit(1);
    }
  }

  const raw = fs.readFileSync(absolutePath, 'utf-8');
  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    console.error(`Invalid JSON in ${absolutePath}`);
    process.exit(1);
  }

  const missing = REQUIRED_KEYS.filter((k) => !(k in config) || config[k] === undefined);
  if (missing.length > 0) {
    console.error(`Missing required keys in ${absolutePath}: ${missing.join(', ')}`);
    process.exit(1);
  }

  const entries = REQUIRED_KEYS.map((k) => `  ${k}: '${String(config[k]).replace(/'/g, "\\'")}'`).join(',\n');
  const output = `export const STATIC_CONFIG = {\n${entries}\n} as const;\n\nexport const BASE_CONFIG = STATIC_CONFIG;\n`;

  const outputPath = path.join(process.cwd(), 'src/cli/constants.generated.ts');
  fs.writeFileSync(outputPath, output, 'utf-8');
}

main();
