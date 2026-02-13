import { FilesModel, PortalsModel } from "../../infra/database/models";
import { logger } from "../../infra";
import { KeyStore } from "../../sdk/key-store";
import { AuthTokenProvider } from "../../sdk/auth-token-provider";
import { fromUint8Array, toUint8Array } from "js-base64";
import { Hex, stringToBytes } from "viem";
import { deriveHKDFKey } from "@fileverse/crypto/kdf";
import { generateKeyPairFromSeed } from "@stablelib/ed25519";
import { EdKeypair } from "../../sdk/ucan";
import { AgentClient } from "../../sdk/smart-agent";
import { FileManager } from "../../sdk/file-manager";
import { getRuntimeConfig } from "../../config";

import { getUserOpReceipt } from "../../sdk/pimlico-utils";
import { parseFileEventLog } from "../../sdk/file-utils";
import { ADDED_FILE_EVENT, EDITED_FILE_EVENT, DELETED_FILE_EVENT } from "../../constants";

import type { PublishResult } from "../../types";
import type { File, Portal, EventType } from "../../types";

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
  console.log("Creating file manager");
  const keyPair = EdKeypair.fromSecretKey(fromUint8Array(ucanSecret));
  console.log("Created key pair");
  const authTokenProvider = new AuthTokenProvider(keyPair, portalAddress);
  console.log("Created auth token provider");
  const keyStore = new KeyStore(toUint8Array(portalSeed), portalAddress, authTokenProvider);
  console.log("Created key store");
  const agentClient = new AgentClient(authTokenProvider);
  console.log("Created agent client");
  await agentClient.initializeAgentClient(privateAccountKey);
  console.log("Initialized agent client");

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
  console.log("Got portal data")
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  console.log("Derived collaborator keys");
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  console.log("Created file manager");
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

export const submitUpdateFileOp = async (
  fileId: string,
): Promise<{ userOpHash: string; metadata: Record<string, unknown> }> => {
  const { file, portalDetails, apiKey } = await getPortalData(fileId);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitUpdateFile(file);
};

export const submitDeleteFileOp = async (
  fileId: string,
): Promise<{ userOpHash: string }> => {
  const { file, portalDetails, apiKey } = await getPortalData(fileId);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  return fileManager.submitDeleteFile(file);
};

export const resolveFileOp = async (
  fileId: string,
  userOpHash: string,
  eventType: EventType,
): Promise<{ receipt: any } | null> => {
  const { portalDetails, apiKey } = await getPortalData(fileId);
  const apiKeySeed = toUint8Array(apiKey);
  const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);
  const fileManager = await createFileManager(
    portalDetails.portalSeed,
    portalDetails.portalAddress as Hex,
    ucanSecret,
    privateAccountKey,
  );
  const { authToken, portalAddress, invokerAddress } = await fileManager.getProxyAuthParams();
  const receipt = await getUserOpReceipt(
    userOpHash as `0x${string}`,
    authToken,
    portalAddress,
    invokerAddress,
  );
  if (!receipt) return null;
  return { receipt };
};
