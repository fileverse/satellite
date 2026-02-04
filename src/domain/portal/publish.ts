import { ApiKeysModel, FilesModel } from '../../infra/database/models';
import { PortalsModel } from '../../infra/database/models';
import { logger } from '../../infra';
import { AuthTokenProvider, KeyStore } from '../../sdk/key-store';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { Hex, stringToBytes } from 'viem';
import { deriveHKDFKey } from '@fileverse/crypto/kdf';
import { generateKeyPairFromSeed } from '@stablelib/ed25519';
import * as ucans from '@ucans/ucans';
import { AgentClient } from '../../sdk/smart-agent';
import { FileManager } from '../../sdk/file-manager';

export interface PublishResult {
  success: boolean;
  onChainFileId: number;
  linkKey?: string;
  linkKeyNonce?: string;
  commentKey?: string;
  metadata: Record<string, unknown>;
}

interface PortalData {
  file: ReturnType<typeof FilesModel.findByIdIncludingDeleted>;
  portalDetails: NonNullable<ReturnType<typeof PortalsModel.findByPortalAddress>>;
  apiKeyData: NonNullable<ReturnType<typeof ApiKeysModel.findByPortalAddress>>;
}

function getPortalData(fileId: string): PortalData {
  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File with _id ${fileId} not found`);
  }

  const portalDetails = PortalsModel.findByPortalAddress(file.portalAddress);
  if (!portalDetails) {
    throw new Error(`Portal with address ${file.portalAddress} not found`);
  }

  const portalAddress = portalDetails.portalAddress as Hex;
  const apiKeyData = ApiKeysModel.findByPortalAddress(portalAddress);
  if (!apiKeyData) {
    throw new Error(`API key with portal address ${portalAddress} not found`);
  }

  return { file, portalDetails, apiKeyData };
}

function deriveCollaboratorKeys(apiKeySeed: Uint8Array) {
  const salt = new Uint8Array([0]);

  const privateAccountKey = deriveHKDFKey(
    apiKeySeed,
    salt,
    stringToBytes('COLLABORATOR_PRIVATE_KEY')
  );

  const ucanDerivedSecret = deriveHKDFKey(
    apiKeySeed,
    salt,
    stringToBytes('COLLABORATOR_UCAN_SECRET')
  );

  const { secretKey: ucanSecret } = generateKeyPairFromSeed(ucanDerivedSecret);

  return { privateAccountKey, ucanSecret };
}

async function createFileManager(
  portalSeed: string,
  portalAddress: Hex,
  ucanSecret: Uint8Array,
  privateAccountKey: Uint8Array
): Promise<FileManager> {
  const keyPair = ucans.EdKeypair.fromSecretKey(fromUint8Array(ucanSecret), {
    exportable: true
  });

  const authTokenProvider = new AuthTokenProvider(keyPair, portalAddress);
  const keyStore = new KeyStore(toUint8Array(portalSeed), portalAddress, authTokenProvider);

  const agentClient = new AgentClient();
  await agentClient.initializeAgentClient(privateAccountKey);

  return new FileManager(keyStore, agentClient);
}

async function executeOperation(
  fileManager: FileManager,
  file: any,
  operation: 'add' | 'update'
): Promise<PublishResult> {
  if (operation === 'add') {
    const result = await fileManager.addFile(file);
    return { success: true, ...result };
  }

  if (operation === 'update') {
    const result = await fileManager.updateFile(file);
    return { success: true, ...result };
  }

  throw new Error(`Invalid operation: ${operation}`);
}

export async function publishFile(fileId: string, operation: 'add' | 'update'): Promise<PublishResult> {
  try {
    const { file, portalDetails, apiKeyData } = getPortalData(fileId);

    const apiKeySeed = toUint8Array(apiKeyData.apiKeySeed);
    const { privateAccountKey, ucanSecret } = deriveCollaboratorKeys(apiKeySeed);

    const fileManager = await createFileManager(
      portalDetails.portalSeed,
      portalDetails.portalAddress as Hex,
      ucanSecret,
      privateAccountKey
    );

    return executeOperation(fileManager, file, operation);
  } catch (error: any) {
    logger.error(`Failed to publish file ${fileId}:`, error);
    throw error;
  }
}
