#!/usr/bin/env node
import { Command } from 'commander';
import { fetchApiKeyData } from './fetch-api-key.js';
import { validateRedisConnection } from './validate-redis.js';
import { scaffoldConfig, configExists } from './scaffold-config.js';
import {
  startAll,
  setupShutdownHandlers,
  waitForProcesses,
} from './process-manager.js';
import { promptForConfig, needsPrompting } from './prompts.js';

const program = new Command()
  .name('satellite')
  .description('Run the Satellite server for Fileverse')
  .version('1.0.0')
  .option('--apiKey <key>', 'API key for authentication')
  .option('--pimlicoApiKey <key>', 'Pimlico API key for account abstraction')
  .option('--rpcUrl <url>', 'RPC URL for blockchain connection')
  .option('--port <port>', 'Port to run the server on', '8001')
  .option('--redis <uri>', 'Redis URI', 'redis://localhost:6379')
  .option('--db <path>', 'Database path')
  .option('--skip-fetch', 'Skip fetching API key data (use existing config)')
  .action(async (options) => {
    try {
      console.log('🛰️  Satellite - Starting initialization...\n');

      if (needsPrompting(options)) {
        const prompted = await promptForConfig({
          apiKey: options.apiKey,
          pimlicoApiKey: options.pimlicoApiKey,
          rpcUrl: options.rpcUrl,
        });
        options.apiKey = prompted.apiKey;
        options.pimlicoApiKey = prompted.pimlicoApiKey;
        options.rpcUrl = prompted.rpcUrl;
        console.log('');
      }

      console.log('Validating Redis connection...');
      await validateRedisConnection(options.redis);
      console.log('✓ Redis connection validated\n');

      if (!options.skipFetch) {
        console.log('Fetching API key data from server...');
        const data = await fetchApiKeyData(options.apiKey);
        console.log('✓ API key data retrieved\n');

        console.log('Setting up configuration...');
        const envPath = scaffoldConfig({
          dbPath: options.db,
          redisUri: options.redis,
          port: options.port,
          apiKey: options.apiKey,
          pimlicoApiKey: options.pimlicoApiKey,
          rpcUrl: options.rpcUrl,
        });
        console.log(`✓ Configuration saved to ${envPath}\n`);

        await initializeDatabase(data);
      } else if (!configExists()) {
        console.error(
          'Error: --skip-fetch requires existing configuration. Run without --skip-fetch first.'
        );
        process.exit(1);
      }

      console.log('Starting services...');
      setupShutdownHandlers();
      startAll();

      console.log(`
✓ Satellite is running!

  API Server: http://127.0.0.1:${options.port}
  Worker:     Active

Press Ctrl+C to stop.
`);

      await waitForProcesses();
    } catch (error) {
      console.error(
        '\n❌ Error:',
        error instanceof Error ? error.message : error
      );
      process.exit(1);
    }
  });

async function initializeDatabase(data: Awaited<ReturnType<typeof fetchApiKeyData>>) {
  const { runMigrations } = await import('../infra/database/migrations/index.js');
  runMigrations();
  console.log('✓ Database migrations complete');

  const { savePortal } = await import('../domain/portal/savePortal.js');
  const { addApiKey } = await import('../domain/portal/saveApiKey.js');
  const { ApiKeysModel } = await import('../infra/database/models/apikeys.model.js');

  const { keyMaterial, appMaterial } = data;

  const portalData = {
    portalAddress: appMaterial.portalAddress,
    portalSeed: appMaterial.portalSeed,
    ownerAddress: appMaterial.ownerAddress,
  };

  const apiKeyData = {
    apiKeySeed: keyMaterial.apiKeySeed,
    name: keyMaterial.name,
    collaboratorAddress: keyMaterial.collaboratorAddress,
    portalAddress: appMaterial.portalAddress,
  }

  savePortal(portalData);
  console.log('✓ Portal saved');

  const existingApiKey = ApiKeysModel.findByPortalAddress(apiKeyData.portalAddress);
  if (!existingApiKey) {
    addApiKey(apiKeyData);
    console.log('✓ API key saved');
  } else {
    console.log('✓ API key already exists');
  }
}

program.parse();
