
import { toUint8Array } from "js-base64";
import { sha256 } from "viem";
import { BASE_CONFIG } from "./constants";
import type { ApiKeyResponse } from "../types";

export const fetchApiKeyData = async (apiKey: string): Promise<ApiKeyResponse> => {
  try {
    const keyHash = sha256(toUint8Array(apiKey));
    const fullUrl = BASE_CONFIG.API_URL + "api-access" + `/${keyHash}`;
    const response = await fetch(fullUrl);

    const { encryptedKeyMaterial, encryptedAppMaterial, id } = await response.json() as ApiKeyResponse;

    return { encryptedKeyMaterial, encryptedAppMaterial, id };
  } catch (error: any) {
    throw new Error(`Server error: ${error.message}`);
  }
};
