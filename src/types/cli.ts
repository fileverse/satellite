export interface ConfigOptions {
  apiKey?: string;
  dbPath?: string;
  port?: string;
  rpcUrl?: string;
}

export interface PromptedConfig {
  apiKey: string;
  rpcUrl: string;
}
