import { FilesModel, PortalsModel } from "../../infra/database/models";
import { logger } from "../../infra";
import { KeyStore } from "../../sdk/key-store";
import { AuthTokenProvider } from "../../sdk/auth-token-provider";
import { fromUint8Array, toUint8Array } from "js-base64";
import { Hex, stringToBytes } from "viem";
import { deriveHKDFKey } from "@fileverse/crypto/kdf";
import { generateKeyPairFromSeed } from "@stablelib/ed25519";
import * as ucans from "@ucans/ucans";
import { AgentClient } from "../../sdk/smart-agent";
import { FileManager } from "../../sdk/file-manager";
import { getRuntimeConfig, isUsingPublicRpc, isRpc429Error, RPC_429_USER_MESSAGE } from "../../config";

import type { PublishResult } from "../../types";
import type { File, Portal } from "../../types";

interface PublishContext {
  file: File | undefined;
  portalDetails: Portal;
  apiKey: string;
}

async function getPortalData(fileId: string): Promise<PublishContext> {
  const file = await FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File with _id ${fileId} not found`);
  }

  const portalDetails = await PortalsModel.findByPortalAddress(file.portalAddress);
  if (!portalDetails) {
    throw new Error(`Portal with address ${file.portalAddress} not found`);
  }

  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  return { file, portalDetails, apiKey };
}

function deriveCollaboratorKeys(apiKeySeed: Uint8Array) {
  const salt = new Uint8Array([0]);

  const privateAccountKey = deriveHKDFKey(apiKeySeed, salt, stringToBytes("COLLABORATOR_PRIVATE_KEY"));

  const ucanDerivedSecret = deriveHKDFKey(apiKeySeed, salt, stringToBytes("COLLABORATOR_UCAN_SECRET"));

  const { secretKey: ucanSecret } = generateKeyPairFromSeed(ucanDerivedSecret);

  return { privateAccountKey, ucanSecret };
}

const createFileManager = async (
  portalSeed: string,
  portalAddress: Hex,
  ucanSecret: Uint8Array,
  privateAccountKey: Uint8Array,
): Promise<FileManager> => {
  const keyPair = ucans.EdKeypair.fromSecretKey(fromUint8Array(ucanSecret), {
    exportable: true,
  });

  const authTokenProvider = new AuthTokenProvider(keyPair, portalAddress);
  const keyStore = new KeyStore(toUint8Array(portalSeed), portalAddress, authTokenProvider);

  const agentClient = new AgentClient(authTokenProvider);
  await agentClient.initializeAgentClient(privateAccountKey);

  return new FileManager(keyStore, agentClient);
};

const executeOperation = async (
  fileManager: FileManager,
  file: any,
  operation: "update" | "delete",
): Promise<PublishResult> => {

  if (operation === "update") {
    const result = await fileManager.updateFile(file);
    return { success: true, ...result };
  }

  if (operation === "delete") {
    const result = await fileManager.deleteFile(file);
    return { success: true, ...result };
  }

  throw new Error(`Invalid operation: ${operation}`);
};

export const handleExistingFileOp = async (fileId: string, operation: "update" | "delete"): Promise<PublishResult> => {
  try {
    const { file, portalDetails, apiKey } = await getPortalData(fileId);

    const apiKeySeed = toUint8Array(apiKey);
    const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);

    const fileManager = await createFileManager(
      portalDetails.portalSeed,
      portalDetails.portalAddress as Hex,
      ucanSecret,
      privateAccountKey,
    );

    return executeOperation(fileManager, file, operation);
  } catch (error: any) {
    if (isUsingPublicRpc() && isRpc429Error(error)) {
      // For public RPCs, map HTTP 429 into a clear user-facing message.
      logger.error(`Failed to publish file ${fileId}: ${RPC_429_USER_MESSAGE}`);
      throw new Error(RPC_429_USER_MESSAGE);
    }

    logger.error(`Failed to publish file ${fileId}:`, error);
    throw error;
  }
};

export const handleNewFileOp = async (
  fileId: string,
): Promise<{
  userOpHash: string;
  linkKey: string;
  linkKeyNonce: string;
  commentKey: string;
  metadata: Record<string, unknown>;
}> => {
  const { file, portalDetails, apiKey } = await getPortalData(fileId);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitAddFileTrx(file);
};

export const getProxyAuthParams = async (
  fileId: string,
): Promise<{
  authToken: string;
  portalAddress: Hex;
  invokerAddress: Hex;
}> => {
  const { portalDetails, apiKey } = await getPortalData(fileId);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.getProxyAuthParams();
};
