import { PortalsModel, Portal } from '../../infra/database/models';

export interface SavePortalInput {
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
}

export function savePortal(input: SavePortalInput): Portal {
  if (!input.portalAddress || !input.portalSeed || !input.ownerAddress) {
    throw new Error('portalAddress, portalSeed, and ownerAddress are required');
  }

  return PortalsModel.upsert(input);
}
