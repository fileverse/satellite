import prompts from 'prompts';
import { STATIC_CONFIG } from './constants';
import { getRuntimeConfig } from '../config/index.js';

export interface PromptedConfig {
  apiKey: string;
  rpcUrl: string;
}

export async function promptForConfig(existingOptions: {
  apiKey?: string;
  rpcUrl?: string;
} = {}): Promise<PromptedConfig> {
  const savedConfig = getRuntimeConfig();
  const questions: prompts.PromptObject[] = [];

  if (!existingOptions.apiKey) {
    questions.push({
      type: 'text',
      name: 'apiKey',
      message: 'Enter your API Key:',
      validate: (value: string) => value.length > 0 || 'API Key is required',
      initial: savedConfig.API_KEY || '',
    });
  }

  if (!existingOptions.rpcUrl) {
    questions.push({
      type: 'text',
      name: 'rpcUrl',
      message: 'Enter RPC URL (press Enter for default):',
      initial: savedConfig.RPC_URL || STATIC_CONFIG.DEFAULT_RPC_URL,
    });
  }

  if (questions.length === 0) {
    return {
      apiKey: existingOptions.apiKey!,
      rpcUrl: existingOptions.rpcUrl || STATIC_CONFIG.DEFAULT_RPC_URL,
    };
  }

  const response = await prompts(questions, {
    onCancel: () => {
      console.log('\nSetup cancelled.');
      process.exit(1);
    },
  });

  return {
    apiKey: existingOptions.apiKey || response.apiKey,
    rpcUrl: existingOptions.rpcUrl || response.rpcUrl || STATIC_CONFIG.DEFAULT_RPC_URL,
  };
}

export function needsPrompting(options: { apiKey?: string }): boolean {
  return !options.apiKey;
}
