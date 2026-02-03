import axios from 'axios';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { sha256 } from 'viem';

export interface PortalData {
  portalAddress: string;
  portalSeed: string;
  ownerAddress: string;
}

export interface ApiKeyData {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}

export interface ApiKeyResponse {
  encryptedKeyMaterial: string;
  encryptedAppMaterial: string;
  id: string;
}

export interface KeyMaterial {
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
}

export interface AppKeyMaterial {
  portalSeed: string;
  ownerAddress: string;
  portalAddress: string;
}

export interface ApiKeyMaterialResponse {
  keyMaterial: KeyMaterial;
  appMaterial: AppKeyMaterial;
  id: string;
}

const DEFAULT_API_URL = 'https://sepolia-dsheet-storage-fc05499ecd15.herokuapp.com/api-access';

export async function fetchApiKeyData(apiKey: string): Promise<ApiKeyMaterialResponse> {
  const apiUrl = process.env.SATELLITE_API_URL || DEFAULT_API_URL;

  try {
    const keyHash = sha256(toUint8Array(apiKey))
    const fullUrl = apiUrl + `/${keyHash}`
    const response = await axios.get<ApiKeyResponse>(fullUrl);

    console.log("response", response.data);

    const { encryptedKeyMaterial, encryptedAppMaterial, id } = response.data;

    const keyMaterial = JSON.parse(new TextDecoder().decode(toUint8Array(encryptedKeyMaterial))) as KeyMaterial;

    const appMaterial = JSON.parse(new TextDecoder().decode(toUint8Array(encryptedAppMaterial))) as AppKeyMaterial;

    console.log("keyMaterial", keyMaterial);
    console.log("appMaterial", appMaterial);

    return { keyMaterial, appMaterial, id };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key');
      }
      if (error.response?.status === 404) {
        throw new Error('API key not found');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to server at ${apiUrl}`);
      }
      throw new Error(
        `Server error: ${error.response?.data?.message || error.message}`
      );
    }
    throw error;
  }
}
