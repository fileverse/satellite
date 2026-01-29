import { uuidv7 } from 'uuidv7';
import type { AddApiKeyInput } from './types';

export class ApiKeyEntity {
  constructor(
    readonly id: string,
    readonly apiKeySeed: string,
    readonly name: string,
    readonly collaboratorAddress: string,
    readonly portalAddress: string,
    readonly createdAt: string,
    readonly isDeleted: number,
  ) {}

  static create(input: AddApiKeyInput): ApiKeyEntity {
    const now = new Date().toISOString();
    return new ApiKeyEntity(
      uuidv7(),
      input.apiKeySeed,
      input.name,
      input.collaboratorAddress,
      input.portalAddress,
      now,
      0,
    );
  }
}
