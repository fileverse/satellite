import { Response } from 'express';
import { successResponse } from '../../responses';
import { BadRequestError } from '../../../../errors';
import type { PortalsRequest } from '../../middleware/portalsContainer';
import type { SavePortalInput, AddApiKeyInput } from '../../../../domain/portal/types';

const addPortalHandler = async (req: PortalsRequest, res: Response) => {
  const { portalAddress, portalSeed, ownerAddress } = req.body;

  if (!portalAddress || !portalSeed || !ownerAddress) {
    throw new BadRequestError('Missing required fields: portalAddress, portalSeed, and ownerAddress are required');
  }

  const portal = await req.context.portalService.savePortal({
    portalAddress,
    portalSeed,
    ownerAddress,
  } as SavePortalInput);
  return successResponse(res, 200, 'Portal saved successfully', portal);
};

const addKeyHandler = async (req: PortalsRequest, res: Response) => {
  const { apiKeySeed, name, collaboratorAddress, portalAddress } = req.body;

  if (!apiKeySeed || !name || !collaboratorAddress || !portalAddress) {
    throw new BadRequestError('Missing required fields: apiKeySeed, name, collaboratorAddress, and portalAddress are required');
  }

  const apiKey = await req.context.apiKeyService.addApiKey({
    apiKeySeed,
    name,
    collaboratorAddress,
    portalAddress,
  } as AddApiKeyInput);
  return successResponse(res, 201, 'API key added successfully', apiKey);
};

const removeKeyHandler = async (req: PortalsRequest, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new BadRequestError('API key ID is required');
  }

  const deletedApiKey = await req.context.apiKeyService.removeApiKey(id);
  return successResponse(res, 200, 'API key removed successfully', deletedApiKey);
};

export const addPortal = [addPortalHandler];
export const addKey = [addKeyHandler];
export const removeKey = [removeKeyHandler];
