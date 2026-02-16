import { toUint8Array } from "js-base64";
import { sha256 } from "viem";
import { BASE_CONFIG } from "./constants";
import type { ApiKeyResponse } from "../types";

export const fetchApiKeyData = async (apiKey: string): Promise<ApiKeyResponse> => {
  const keyHash = sha256(toUint8Array(apiKey));
  const fullUrl = BASE_CONFIG.API_URL + "api-access" + `/${keyHash}`;

  let response: Response;
  try {
    response = await fetch(fullUrl);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot connect to server at ${BASE_CONFIG.API_URL}`);
    }
    throw error;
  }

  if (response.status === 401) throw new Error("Invalid API key");
  if (response.status === 404) throw new Error("API key not found");

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(`Server error: ${data?.message || response.statusText}`);
  }

  const { encryptedKeyMaterial, encryptedAppMaterial, id } = (await response.json()) as ApiKeyResponse;
  return { encryptedKeyMaterial, encryptedAppMaterial, id };
};
