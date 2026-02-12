import { fetchApiKeyData } from "../cli/fetch-api-key.js";
import { savePortal } from "../domain/portal/savePortal.js";
import { addApiKey } from "../domain/portal/saveApiKey.js";
import { ApiKeysModel } from "../infra/database/models/apikeys.model.js";
import { logger } from "../infra/index.js";
import type { ApiKeyMaterialResponse, InitResult, KeyMaterial, AppKeyMaterial } from "../types";
import { deriveHKDFKey } from "@fileverse/crypto/hkdf";
import { toUint8Array } from "js-base64";
import { stringToBytes } from "viem";
import { toAESKey, aesDecrypt } from "@fileverse/crypto/webcrypto";

export type { InitResult };

const SAVED_DATA_ENCRYPTION_KEY_INFO = "SAVED_DATA_ENCRYPTION_KEY";

export async function initializeWithData(data: ApiKeyMaterialResponse): Promise<InitResult> {
  const { keyMaterial, appMaterial } = data;

  await savePortal({
    portalAddress: appMaterial.portalAddress,
    portalSeed: appMaterial.portalSeed,
    ownerAddress: appMaterial.ownerAddress,
  });

  const existingApiKey = await ApiKeysModel.findByApiKey(keyMaterial.apiKeySeed);

  if (!existingApiKey) {
    await addApiKey({
      apiKeySeed: keyMaterial.apiKeySeed,
      name: keyMaterial.name,
      collaboratorAddress: keyMaterial.collaboratorAddress,
      portalAddress: appMaterial.portalAddress,
    });
    return { portalSaved: true, apiKeySaved: true };
  }

  return { portalSaved: true, apiKeySaved: false };
}

export const getAesKeyFromApiKey = async (apiKey: string) => {
  const rawSecret = deriveHKDFKey(
    toUint8Array(apiKey),
    new Uint8Array([0]),
    stringToBytes(SAVED_DATA_ENCRYPTION_KEY_INFO),
  );
  return await toAESKey(rawSecret);
};

const bytestToJSON = (bytes: Uint8Array) => {
  return JSON.parse(new TextDecoder().decode(bytes));
};

export const decryptSavedData = async <T>(apiKey: string, encryptedData: string): Promise<T> => {
  const aesKey = await getAesKeyFromApiKey(apiKey);
  const decryptedBytes = await aesDecrypt(aesKey, toUint8Array(encryptedData));

  const data = bytestToJSON(decryptedBytes) as T;
  return data;
};

export const initializeFromApiKey = async (apiKey: string): Promise<void> => {
  logger.debug("Fetching API key data from server...");
  const data = await fetchApiKeyData(apiKey);
  logger.debug("API key data retrieved");

  const keyMaterial = await decryptSavedData<KeyMaterial>(apiKey, data.encryptedKeyMaterial);
  const appMaterial = await decryptSavedData<AppKeyMaterial>(apiKey, data.encryptedAppMaterial);
  const result = await initializeWithData({ keyMaterial, appMaterial, id: data.id });

  logger.debug("Portal saved");
  if (result.apiKeySaved) {
    logger.debug("API key saved");
  } else {
    logger.debug("API key already exists");
  }
};
