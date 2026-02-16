import { PortalsModel } from "../../infra/database/models";
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
import { getRuntimeConfig } from "../../config";
import { getUserOpReceipt } from "../../sdk/pimlico-utils";
import type { PublishResult } from "../../types";
import type { FileEntity, Portal } from "../../types";

interface PublishContext {
  portalDetails: Portal;
  apiKey: string;
}

async function getFileWithPortalData(portalAddress: string): Promise<PublishContext> {
  const portalDetails = await PortalsModel.findByPortalAddress(portalAddress);
  if (!portalDetails) {
    throw new Error(`Portal with address ${portalAddress} not found`);
  }

  const apiKey = getRuntimeConfig().API_KEY;
  if (!apiKey) {
    throw new Error("API key is not set");
  }

  return { portalDetails, apiKey };
}

function deriveCollaboratorKeys(apiKeySeed: Uint8Array) {
  const salt = new Uint8Array([0]);

  const privateAccountKey = deriveHKDFKey(apiKeySeed, salt, stringToBytes("COLLABORATOR_PRIVATE_KEY"));

  const ucanDerivedSecret = deriveHKDFKey(apiKeySeed, salt, stringToBytes("COLLABORATOR_UCAN_SECRET"));

  const { secretKey: ucanSecret } = generateKeyPairFromSeed(ucanDerivedSecret);

  return { privateAccountKey, ucanSecret };
}

const setupAgentClient = async (privateAccountKey: Uint8Array, authTokenProvider: AuthTokenProvider) => {
  const agentClient = new AgentClient(authTokenProvider);
  await agentClient.initializeAgentClient(privateAccountKey);
  return agentClient;
};

const setupKeyStore = (portalSeed: string, authTokenProvider: AuthTokenProvider) => {
  const keyStore = new KeyStore(toUint8Array(portalSeed), authTokenProvider);
  return keyStore;
};

export const setupAuthTokenProvider = (ucanSecret: Uint8Array, portalAddress: Hex) => {
  const keyPair = ucans.EdKeypair.fromSecretKey(fromUint8Array(ucanSecret), {
    exportable: true,
  });
  return new AuthTokenProvider(keyPair, portalAddress);
};

const createFileManager = async (
  portalSeed: string,
  portalAddress: Hex,
  ucanSecret: Uint8Array,
  privateAccountKey: Uint8Array,
): Promise<FileManager> => {
  const authTokenProvider = setupAuthTokenProvider(ucanSecret, portalAddress);
  const keyStore = setupKeyStore(portalSeed, authTokenProvider);

  const agentClient = await setupAgentClient(privateAccountKey, authTokenProvider);

  return new FileManager(keyStore, agentClient);
};

const executeOperation = async (
  fileManager: FileManager,
  fileEntity: FileEntity,
  operation: "update" | "delete",
): Promise<PublishResult> => {
  if (operation === "update") {
    const result = await fileManager.updateFile(fileEntity);
    return { success: true, ...result };
  }

  if (operation === "delete") {
    const result = await fileManager.deleteFile(fileEntity);
    return { success: true, onChainFileId: result.onChainFileId!, metadata: result.metadata };
  }

  throw new Error(`Invalid operation: ${operation}`);
};

export const handleExistingFileOp = async (
  fileEntity: FileEntity,
  operation: "update" | "delete",
): Promise<PublishResult> => {
  try {
    const { portalDetails, apiKey } = await getFileWithPortalData(fileEntity.portalAddress);

    const apiKeySeed = toUint8Array(apiKey);
    const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);

    const fileManager = await createFileManager(
      portalDetails.portalSeed,
      portalDetails.portalAddress as Hex,
      ucanSecret,
      privateAccountKey,
    );

    return executeOperation(fileManager, fileEntity, operation);
  } catch (error: any) {
    logger.error(`Failed to publish file ${fileEntity.ddocId}:`, error);
    throw error;
  }
};

export const handleNewFileOp = async (
  fileEntity: FileEntity,
): Promise<{
  userOpHash: string;
  metadata: Record<string, unknown>;
}> => {
  const { portalDetails, apiKey } = await getFileWithPortalData(fileEntity.portalAddress);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitAddFileTrx(fileEntity);
};

export const getProxyAuthParams = async (
  portalAddress: string,
): Promise<{
  authToken: string;
  portalAddress: Hex;
  invokerAddress: Hex;
}> => {
  const { portalDetails, apiKey } = await getFileWithPortalData(portalAddress);
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

export const submitUpdateFileOp = async (
  fileEntity: FileEntity,
): Promise<{ userOpHash: string; metadata: Record<string, unknown> }> => {
  const { portalDetails, apiKey } = await getFileWithPortalData(fileEntity.portalAddress);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitUpdateFile(fileEntity);
};

export const submitDeleteFileOp = async (fileEntity: FileEntity): Promise<{ userOpHash: string }> => {
  const { portalDetails, apiKey } = await getFileWithPortalData(fileEntity.portalAddress);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitDeleteFile(fileEntity);
};

export const resolveFileOp = async (portalAddress: Hex, userOpHash: string): Promise<{ receipt: any } | null> => {

  const { portalDetails, apiKey } = await getFileWithPortalData(portalAddress);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);

  const authProvider = setupAuthTokenProvider(ucanSecret, portalDetails.portalAddress as Hex);
  const agentClient = await setupAgentClient(privateAccountKey, authProvider);

  const { authToken, invokerAddress } = await agentClient.getAuthParams();

  const receipt = await getUserOpReceipt(userOpHash as `0x${string}`, authToken, portalAddress, invokerAddress);
  if (!receipt) return null;
  return { receipt };
};
