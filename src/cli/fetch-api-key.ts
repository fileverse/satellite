import axios from "axios";
import { toUint8Array } from "js-base64";
import { sha256 } from "viem";
import { BASE_CONFIG } from "./constants";
import type { ApiKeyResponse } from "../types";

export const fetchApiKeyData = async (apiKey: string): Promise<ApiKeyResponse> => {
  try {
    const keyHash = sha256(toUint8Array(apiKey));
    const fullUrl = BASE_CONFIG.API_URL + "api-access" + `/${keyHash}`;
    const response = await axios.get<ApiKeyResponse>(fullUrl);

    const { encryptedKeyMaterial, encryptedAppMaterial, id } = response.data;

    return { encryptedKeyMaterial, encryptedAppMaterial, id };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Invalid API key");
      }
      if (error.response?.status === 404) {
        throw new Error("API key not found");
      }
      if (error.code === "ECONNREFUSED") {
        throw new Error(`Cannot connect to server at ${BASE_CONFIG.API_URL}`);
      }
      throw new Error(`Server error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
};
