import { fetchApiKeyData, type ApiKeyMaterialResponse } from '../cli/fetch-api-key.js';
import { savePortal } from '../domain/portal/savePortal.js';
import { addApiKey } from '../domain/portal/saveApiKey.js';
import { ApiKeysModel } from '../infra/database/models/apikeys.model.js';
import { logger } from '../infra/index.js';

export interface InitResult {
  portalSaved: boolean;
  apiKeySaved: boolean;
}

export function initializeWithData(data: ApiKeyMaterialResponse): InitResult {
  const { keyMaterial, appMaterial } = data;

  savePortal({
    portalAddress: appMaterial.portalAddress,
    portalSeed: appMaterial.portalSeed,
    ownerAddress: appMaterial.ownerAddress,
  });

  const existingApiKey = ApiKeysModel.findByPortalAddress(appMaterial.portalAddress);
  if (!existingApiKey) {
    addApiKey({
      apiKeySeed: keyMaterial.apiKeySeed,
      name: keyMaterial.name,
      collaboratorAddress: keyMaterial.collaboratorAddress,
      portalAddress: appMaterial.portalAddress,
    });
    return { portalSaved: true, apiKeySaved: true };
  }

  return { portalSaved: true, apiKeySaved: false };
}

export async function initializeFromApiKey(apiKey: string): Promise<void> {
  logger.info('Fetching API key data from server...');
  const data = await fetchApiKeyData(apiKey);
  logger.info('API key data retrieved');

  const result = initializeWithData(data);
  
  logger.info('Portal saved');
  if (result.apiKeySaved) {
    logger.info('API key saved');
  } else {
    logger.info('API key already exists');
  }
}
