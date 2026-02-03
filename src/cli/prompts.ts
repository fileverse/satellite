import prompts from 'prompts';
import { config } from '../config';

const DEFAULT_RPC_URL = config.RPC_URL as string || 'https://rpc.sepolia.org';

export interface PromptedConfig {
  apiKey: string;
  pimlicoApiKey: string;
  rpcUrl: string;
}

export async function promptForConfig(existingOptions: {
  apiKey?: string;
  pimlicoApiKey?: string;
  rpcUrl?: string;
} = {}): Promise<PromptedConfig> {
  const questions: prompts.PromptObject[] = [];

  if (!existingOptions.apiKey) {
    questions.push({
      type: 'text',
      name: 'apiKey',
      message: 'Enter your API Key:',
      validate: (value: string) => value.length > 0 || 'API Key is required',
    });
  }

  if (!existingOptions.pimlicoApiKey) {
    questions.push({
      type: 'text',
      name: 'pimlicoApiKey',
      message: 'Enter your Pimlico API Key:',
      validate: (value: string) => value.length > 0 || 'Pimlico API Key is required',
    });
  }

  if (!existingOptions.rpcUrl) {
    questions.push({
      type: 'text',
      name: 'rpcUrl',
      message: 'Enter RPC URL (press Enter for default):',
      initial: DEFAULT_RPC_URL,
    });
  }

  if (questions.length === 0) {
    return {
      apiKey: existingOptions.apiKey!,
      pimlicoApiKey: existingOptions.pimlicoApiKey!,
      rpcUrl: existingOptions.rpcUrl || DEFAULT_RPC_URL,
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
    pimlicoApiKey: existingOptions.pimlicoApiKey || response.pimlicoApiKey,
    rpcUrl: existingOptions.rpcUrl || response.rpcUrl || DEFAULT_RPC_URL,
  };
}

export function needsPrompting(options: {
  apiKey?: string;
  pimlicoApiKey?: string;
}): boolean {
  return !options.apiKey || !options.pimlicoApiKey;
}
