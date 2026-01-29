import { PortalsRepository } from '../../infra/database/repositories/PortalsRepository';
import { PortalEntity } from './PortalEntity';
import { BadRequestError } from '../../errors';
import type { SavePortalInput, UpdatePortalInput } from './types';

export class PortalService {
  constructor(private readonly portalsRepository: PortalsRepository) {}

  async getByPortalAddress(portalAddress: string): Promise<PortalEntity | null> {
    return this.portalsRepository.getByPortalAddress(portalAddress);
  }

  /** Upsert: create or update by portalAddress. */
  async savePortal(input: SavePortalInput): Promise<PortalEntity> {
    if (!input.portalAddress?.trim() || !input.portalSeed?.trim() || !input.ownerAddress?.trim()) {
      throw new BadRequestError('portalAddress, portalSeed, and ownerAddress are required');
    }
    const existing = this.portalsRepository.getByPortalAddress(input.portalAddress);
    if (existing) {
      const updated = existing.withUpdate({
        portalSeed: input.portalSeed,
        ownerAddress: input.ownerAddress,
      });
      this.portalsRepository.update(updated);
      return updated;
    }
    const portal = PortalEntity.create(input);
    this.portalsRepository.create(portal);
    return portal;
  }
}
