import { PortalsModel } from "../../infra/database/models";
import type { Portal, SavePortalInput } from "../../types";

export function savePortal(input: SavePortalInput): Portal {
  if (!input.portalAddress || !input.portalSeed || !input.ownerAddress) {
    throw new Error("portalAddress, portalSeed, and ownerAddress are required");
  }

  return PortalsModel.upsert(input);
}
