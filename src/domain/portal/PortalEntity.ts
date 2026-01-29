import { uuidv7 } from 'uuidv7';
import type { SavePortalInput, UpdatePortalInput } from './types';

export class PortalEntity {
  constructor(
    readonly id: string,
    readonly portalAddress: string,
    readonly portalSeed: string,
    readonly ownerAddress: string,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static create(input: SavePortalInput): PortalEntity {
    const now = new Date().toISOString();
    return new PortalEntity(
      uuidv7(),
      input.portalAddress,
      input.portalSeed,
      input.ownerAddress,
      now,
      now,
    );
  }

  withUpdate(payload: UpdatePortalInput): PortalEntity {
    return new PortalEntity(
      this.id,
      this.portalAddress,
      payload.portalSeed ?? this.portalSeed,
      payload.ownerAddress ?? this.ownerAddress,
      this.createdAt,
      new Date().toISOString(),
    );
  }
}
