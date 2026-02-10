export interface SavePortalInput {
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
}

export interface AddApiKeyInput {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}

export interface PublishResult {
  success: boolean;
  onChainFileId: number;
  linkKey?: string;
  linkKeyNonce?: string;
  commentKey?: string;
  metadata: Record<string, unknown>;
}

export interface PortalData {
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
}

export interface ApiKeyData {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}

export interface ApiKeyResponse {
  encryptedKeyMaterial: string;
  encryptedAppMaterial: string;
  id: string;
}

export interface KeyMaterial {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}

export interface AppKeyMaterial {
  portalSeed: string;
  ownerAddress: string;
  portalAddress: string;
}

export interface ApiKeyMaterialResponse {
  keyMaterial: KeyMaterial;
  appMaterial: AppKeyMaterial;
  id: string;
}
