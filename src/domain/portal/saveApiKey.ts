import { ApiKeysModel, PortalsModel } from "../../infra/database/models";
import type { AddApiKeyInput, ApiKey } from "../../types";

export async function addApiKey(input: AddApiKeyInput): Promise<ApiKey> {
  if (!input.apiKeySeed || !input.name || !input.collaboratorAddress || !input.portalAddress) {
    throw new Error("apiKeySeed, name, collaboratorAddress, and portalAddress are required");
  }

  const portal = await PortalsModel.findByPortalAddress(input.portalAddress);
  if (!portal) {
    throw new Error(`Portal with address ${input.portalAddress} does not exist`);
  }

  return ApiKeysModel.create(input);
}
