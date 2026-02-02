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
}

export async function publishFile(fileId: string): Promise<PublishResult> {
  // use findByIdIncludingDeleted to process deleted events as well
  const file = FilesModel.findByIdIncludingDeleted(fileId);
  if (!file) {
    throw new Error(`File with _id ${fileId} not found`);
  }

  try {
    console.log(file)



    const portalDetails = await PortalsModel.findByPortalAddress(file.portalAddress);
    if (!portalDetails) {
      throw new Error(`Portal with address ${file.portalAddress} not found`);
    }

    const portalSeed = portalDetails.portalSeed;
    const portalAddress = portalDetails.portalAddress as Hex;
    const apiKeyData = await ApiKeysModel.findByPortalAddress(portalAddress);
    if (!apiKeyData) {
      throw new Error(`API key with portal address ${portalAddress} not found`);
    }

    const salt = new Uint8Array([0]);
    const apiKeySeed = toUint8Array(apiKeyData.apiKeySeed);
    const privateAccountKey = deriveHKDFKey(
      apiKeySeed,
      salt,
      stringToBytes('COLLABORATOR_PRIVATE_KEY')
    );
    const collaboratorDerivedUcanSecret = deriveHKDFKey(
      apiKeySeed,
      salt,
      stringToBytes('COLLABORATOR_UCAN_SECRET')
    );

    const { secretKey: ucanSecret } = generateKeyPairFromSeed(collaboratorDerivedUcanSecret)

    const keyPair = ucans.EdKeypair.fromSecretKey(fromUint8Array(ucanSecret), {
      exportable: true
    });

    const authTokenProvider = new AuthTokenProvider(keyPair, portalAddress)

    const keyStore = new KeyStore(toUint8Array(portalDetails.portalSeed), portalAddress, authTokenProvider)

    const agentClient = new AgentClient()

    await agentClient.initializeAgentClient(privateAccountKey)

    const fileManager = new FileManager(keyStore);

    await fileManager.publishFile(file, agentClient)

    // Simulate onchain publishing by having a delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    return {
      success: true,
    };
  } catch (error: any) {
    logger.error(`Failed to publish file ${fileId}:`, error);
    throw error;
  }
}
