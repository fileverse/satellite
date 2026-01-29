export interface SavePortalInput {
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
}

export interface UpdatePortalInput {
  portalSeed?: string;
  ownerAddress?: string;
}

export interface AddApiKeyInput {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}
