import { ApiKeysModel, ApiKey } from '../../infra/database/models';

export function removeApiKey(_id: string): ApiKey {
  if (!_id) {
    throw new Error('API key ID is required');
  }

  const apiKey = ApiKeysModel.findById(_id);
  if (!apiKey) {
    throw new Error('API key not found');
  }

  ApiKeysModel.delete(_id);
  return { ...apiKey, isDeleted: 1 };
}
