import { ApiKeysModel, type ApiKey } from "../../infra/database/models";

export async function removeApiKey(collaboratorAddress: string): Promise<ApiKey> {
  if (!collaboratorAddress) {
    throw new Error("collaboratorAddress is required");
  }

  const apiKey = await ApiKeysModel.findByCollaboratorAddress(collaboratorAddress);
  if (!apiKey) {
    throw new Error("API key not found");
  }

  await ApiKeysModel.delete(apiKey._id);
  return { ...apiKey, isDeleted: 1 };
}
