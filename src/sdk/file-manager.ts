import { fromUint8Array, toUint8Array } from "js-base64";
import { KeyStore } from "./key-store";
import {
  buildLinklock,
  encryptTitleWithFileKey,
  generateLinkKeyMaterial,
  prepareCallData,
  createEncryptedContentFile,
  buildFileMetadata,
  parseFileEventLog,
  uploadAllFilesToIPFS,
  UploadFileAuthParams,
  prepareDeleteFileCallData,
} from "./file-utils";
import { AgentClient } from "./smart-agent";
import { generateAESKey, exportAESKey } from "@fileverse/crypto/webcrypto";
import { STATIC_CONFIG } from "../cli/constants";
import { ADDED_FILE_EVENT, DELETED_FILE_EVENT, EDITED_FILE_EVENT } from "../constants";
import { markdownToYjs } from "@fileverse/content-processor";
import { logger } from "../infra";

export class FileManager {
  private keyStore: KeyStore;
  private agentClient: AgentClient;

  constructor(keyStore: KeyStore, agentClient: AgentClient) {
    this.keyStore = keyStore;
    this.agentClient = agentClient;
  }

  private createLocks(key: string, encryptedSecretKey: string, commentKey: Uint8Array) {
    const appLock = {
      lockedFileKey: this.keyStore.encryptData(toUint8Array(key)),
      lockedLinkKey: this.keyStore.encryptData(toUint8Array(encryptedSecretKey)),
      lockedChatKey: this.keyStore.encryptData(commentKey),
    };
    return { appLock, ownerLock: { ...appLock } };
  }

  private async getAuthParams(): Promise<UploadFileAuthParams> {
    return {
      token: await this.keyStore.getAuthToken(STATIC_CONFIG.SERVER_DID),
      contractAddress: this.keyStore.getPortalAddress(),
      invoker: this.agentClient.getAgentAddress(),
    };
  }

  private async executeFileOperation(callData: `0x${string}`) {
    return this.agentClient.executeUserOperationRequest(
      {
        contractAddress: this.keyStore.getPortalAddress(),
        data: callData,
      },
      1000000,
    );
  }

  private async sendFileOperation(callData: `0x${string}`) {
    return this.agentClient.sendUserOperation(
      {
        contractAddress: this.keyStore.getPortalAddress(),
        data: callData,
      },
      1000000,
    );
  }

  async getProxyAuthParams() {
    return this.agentClient.getAuthParams();
  }

  async submitAddFileTrx(file: any) {
    logger.info(`Preparing to add file ${file.ddocId}`);
    const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
      ddocId: file.ddocId,
      linkKey: file.linkKey,
      linkKeyNonce: file.linkKeyNonce,
    });

    const yJSContent = markdownToYjs(file.content);
    const { encryptedFile, key } = await createEncryptedContentFile(yJSContent);
    logger.info(`Generated encrypted content file for file ${file.ddocId}`);
    const commentKey = await exportAESKey(await generateAESKey(128));

    const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
    const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);

    const encryptedTitle = await encryptTitleWithFileKey({
      title: file.title || "Untitled",
      key,
    });
    const metadata = buildFileMetadata({
      encryptedTitle,
      encryptedFileSize: encryptedFile.size,
      appLock,
      ownerLock,
      ddocId: file.ddocId,
      nonce: fromUint8Array(nonce),
      owner: this.agentClient.getAgentAddress(),
    });

    const authParams = await this.getAuthParams();
    const { metadataHash, contentHash, gateHash } = await uploadAllFilesToIPFS(
      { metadata, encryptedFile, linkLock, ddocId: file.ddocId },
      authParams,
    );
    logger.info(`Uploaded files to IPFS for file ${file.ddocId}`);

    const callData = prepareCallData({
      metadataHash,
      contentHash,
      gateHash,
      appFileId: file.ddocId,
      fileId: file.fileId,
    });
    logger.info(`Prepared call data for file ${file.ddocId}`);

    const userOpHash = await this.sendFileOperation(callData);
    logger.info(`Submitted user op for file ${file.ddocId}`);
    return {
      userOpHash,
      linkKey: encryptedSecretKey,
      linkKeyNonce: fromUint8Array(nonce),
      commentKey: fromUint8Array(commentKey),
      metadata,
    };
  }

  async addFile(file: any) {
    logger.info(`Preparing to add file ${file.ddocId}`);
    const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
      ddocId: file.ddocId,
      linkKey: file.linkKey,
      linkKeyNonce: file.linkKeyNonce,
    });

    const yJSContent = markdownToYjs(file.content);
    const { encryptedFile, key } = await createEncryptedContentFile(yJSContent);
    logger.info(`Generated encrypted content file for file ${file.ddocId}`);
    const commentKey = await exportAESKey(await generateAESKey(128));

    const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
    const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);

    const encryptedTitle = await encryptTitleWithFileKey({
      title: file.title || "Untitled",
      key,
    });
    const metadata = buildFileMetadata({
      encryptedTitle,
      encryptedFileSize: encryptedFile.size,
      appLock,
      ownerLock,
      ddocId: file.ddocId,
      nonce: fromUint8Array(nonce),
      owner: this.agentClient.getAgentAddress(),
    });

    const authParams = await this.getAuthParams();
    const { metadataHash, contentHash, gateHash } = await uploadAllFilesToIPFS(
      { metadata, encryptedFile, linkLock, ddocId: file.ddocId },
      authParams,
    );
    logger.info(`Uploaded files to IPFS for file ${file.ddocId}`);

    const callData = prepareCallData({
      metadataHash,
      contentHash,
      gateHash,
      appFileId: file.ddocId,
      fileId: file.fileId,
    });
    logger.info(`Prepared call data for file ${file.ddocId}`);

    const { logs } = await this.executeFileOperation(callData);
    const onChainFileId = parseFileEventLog(logs, "AddedFile", ADDED_FILE_EVENT);
    logger.info(`Executed file operation for file ${file.ddocId}`);
    return {
      onChainFileId,
      linkKey: encryptedSecretKey,
      linkKeyNonce: fromUint8Array(nonce),
      commentKey: fromUint8Array(commentKey),
      metadata,
    };
  }

  async updateFile(file: any) {
    logger.info(`Updating file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
      ddocId: file.ddocId,
      linkKey: file.linkKey,
      linkKeyNonce: file.linkKeyNonce,
    });

    logger.info(`Generating encrypted content file for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

    const yjsContent = markdownToYjs(file.content);
    const { encryptedFile, key } = await createEncryptedContentFile(yjsContent);
    const commentKey = toUint8Array(file.commentKey);

    const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
    const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);

    const encryptedTitle = await encryptTitleWithFileKey({
      title: file.title || "Untitled",
      key,
    });
    const metadata = buildFileMetadata({
      encryptedTitle,
      encryptedFileSize: encryptedFile.size,
      appLock,
      ownerLock,
      ddocId: file.ddocId,
      nonce: fromUint8Array(nonce),
      owner: this.agentClient.getAgentAddress(),
    });

    const authParams = await this.getAuthParams();
    logger.info(`Uploading files to IPFS for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const { metadataHash, contentHash, gateHash } = await uploadAllFilesToIPFS(
      { metadata, encryptedFile, linkLock, ddocId: file.ddocId },
      authParams,
    );

    const callData = prepareCallData({
      metadataHash,
      contentHash,
      gateHash,
      appFileId: file.ddocId,
      fileId: file.onChainFileId,
    });
    logger.info(`Executing file operation for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

    const { logs } = await this.executeFileOperation(callData);
    const onChainFileId = parseFileEventLog(logs, "EditedFile", EDITED_FILE_EVENT);

    return { onChainFileId, metadata };
  }

  async deleteFile(file: any) {
    logger.info(`Deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const callData = prepareDeleteFileCallData({
      onChainFileId: file.onChainFileId,
    });
    logger.info(`Prepared call data for deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

    const { logs } = await this.executeFileOperation(callData);
    parseFileEventLog(logs, "DeletedFile", DELETED_FILE_EVENT);
    logger.info(`Executed file operation for deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    return {
      fileId: file.id,
      onChainFileId: file.onChainFileId,
      metadata: file.metadata,
    };
  }
}
