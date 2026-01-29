import { ApiKeysRepository } from '../../infra/database/repositories/ApiKeysRepository';
import { PortalsRepository } from '../../infra/database/repositories/PortalsRepository';
import { ApiKeyEntity } from './ApiKeyEntity';
import { BadRequestError, NotFoundError } from '../../errors';
import type { AddApiKeyInput } from './types';

export class ApiKeyService {
  constructor(
    private readonly apiKeysRepository: ApiKeysRepository,
    private readonly portalsRepository: PortalsRepository,
  ) {}

  async addApiKey(input: AddApiKeyInput): Promise<ApiKeyEntity> {
    if (!input.apiKeySeed?.trim() || !input.name?.trim() || !input.collaboratorAddress?.trim() || !input.portalAddress?.trim()) {
      throw new BadRequestError('apiKeySeed, name, collaboratorAddress, and portalAddress are required');
    }
    const portal = this.portalsRepository.getByPortalAddress(input.portalAddress);
    if (!portal) {
      throw new NotFoundError(`Portal with address ${input.portalAddress} does not exist`);
    }
    const apiKey = ApiKeyEntity.create(input);
    this.apiKeysRepository.create(apiKey);
    return apiKey;
  }

  async removeApiKey(id: string): Promise<ApiKeyEntity> {
    if (!id?.trim()) {
      throw new BadRequestError('API key ID is required');
    }
    const apiKey = this.apiKeysRepository.findById(id);
    if (!apiKey) {
      throw new NotFoundError('API key not found');
    }
    this.apiKeysRepository.softDelete(id);
    return apiKey;
  }
}
