#!/usr/bin/env node
import { Command } from 'commander';
import { AppKeyMaterial, fetchApiKeyData, KeyMaterial } from './fetch-api-key.js';
import { scaffoldConfig, configExists } from './scaffold-config.js';
import {
  startAll,
  setupShutdownHandlers,
  waitForProcesses,
} from './process-manager.js';
import { promptForConfig, needsPrompting } from './prompts.js';
import { loadConfig } from '../config/index.js';
import { decryptSavedData, initializeWithData } from '../init/index.js';

const program = new Command()
  .name('satellite')
  .description('Run the Satellite server for Fileverse')
  .version('0.0.1')
  .option('--apiKey <key>', 'API key for authentication')
  .option('--rpcUrl <url>', 'RPC URL for blockchain connection')
  .option('--port <port>', 'Port to run the server on', '8001')
  .option('--db <path>', 'Database path')
  .option('--skip-fetch', 'Skip fetching API key data (use existing config)')
  .action(async (options) => {
    try {
      console.log('🛰️  Satellite - Starting initialization...\n');

      if (needsPrompting(options)) {
        const prompted = await promptForConfig({
          apiKey: options.apiKey,
          rpcUrl: options.rpcUrl,
        });
        options.apiKey = prompted.apiKey;
        options.rpcUrl = prompted.rpcUrl;
      }

      if (!options.skipFetch) {
        console.log('Fetching API key data from server...');
        const data = await fetchApiKeyData(options.apiKey);
        console.log('✓ API key data retrieved\n');

        const keyMaterial = await decryptSavedData<KeyMaterial>(options.apiKey, data.encryptedKeyMaterial);
        const appMaterial = await decryptSavedData<AppKeyMaterial>(options.apiKey, data.encryptedAppMaterial);
        console.log('Setting up configuration...');
        const envPath = scaffoldConfig({
          dbPath: options.db,
          port: options.port,
          apiKey: options.apiKey,
          rpcUrl: options.rpcUrl,
        });
        loadConfig();
        console.log(`✓ Configuration saved to ${envPath}\n`);

        const { runMigrations } = await import('../infra/database/migrations/index.js');
        runMigrations();
        console.log('✓ Database migrations complete');

        const result = initializeWithData({ keyMaterial, appMaterial, id: data.id });
        console.log('✓ Portal saved');
        if (result.apiKeySaved) {
          console.log('✓ API key saved');
        } else {
          console.log('✓ API key already exists');
        }
      } else if (!configExists()) {
        console.error(
          'Error: --skip-fetch requires existing configuration. Run without --skip-fetch first.'
        );
        process.exit(1);
      }

      console.log('\nStarting services...');
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

program.parse();
