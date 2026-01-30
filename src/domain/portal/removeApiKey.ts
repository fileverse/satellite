import { ApiKeysModel, ApiKey } from '../../infra/database/models';

export function removeApiKey(collaboratorAddress: string): ApiKey {
  if (!collaboratorAddress) {
    throw new Error('collaboratorAddress is required');
  }

  const apiKey = ApiKeysModel.findByCollaboratorAddress(collaboratorAddress);
  if (!apiKey) {
    throw new Error('API key not found');
  }

  ApiKeysModel.delete(apiKey._id);
  return { ...apiKey, isDeleted: 1 };
}
