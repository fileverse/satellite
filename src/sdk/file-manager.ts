import { fromUint8Array, toUint8Array } from "js-base64";
import { KeyStore } from "./key-store";
import {
  buildLinklock,
  encryptTitleWithFileKey,
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
import { DELETED_FILE_EVENT, EDITED_FILE_EVENT } from "../constants";
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
    console.log("Submitting add file trx");
    logger.debug(`Preparing to add file ${file.ddocId}`);
    const encryptedSecretKey = file.linkKey;
    const nonce = toUint8Array(file.linkKeyNonce);
    const secretKey = toUint8Array(file.secretKey);
    console.log("Got encrypted secret key, nonce, and secret key");
    const yJSContent = markdownToYjs(file.content);
    console.log("Generated yjs content");
    const { encryptedFile, key } = await createEncryptedContentFile(yJSContent);
    console.log("Generated encrypted content file");
    logger.debug(`Generated encrypted content file for file ${file.ddocId}`);
    const commentKey = await exportAESKey(await generateAESKey(128));
    console.log("Generated comment key");
    const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
    console.log("Built app lock and owner lock");
    const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);
    console.log("Built link lock");
    const encryptedTitle = await encryptTitleWithFileKey({
      title: file.title || "Untitled",
      key,
    });
    console.log("Built encrypted title");
    const metadata = buildFileMetadata({
      encryptedTitle,
      encryptedFileSize: encryptedFile.size,
      appLock,
      ownerLock,
      ddocId: file.ddocId,
      nonce: fromUint8Array(nonce),
      owner: this.agentClient.getAgentAddress(),
    });
    console.log("Built metadata");

    const authParams = await this.getAuthParams();
    console.log("Got auth params");
    console.log("Uploading files to IPFS");
    const { metadataHash, contentHash, gateHash } = await uploadAllFilesToIPFS(
      { metadata, encryptedFile, linkLock, ddocId: file.ddocId },
      authParams,
    );
    console.log("Uploaded files to IPFS");
    logger.debug(`Uploaded files to IPFS for file ${file.ddocId}`);


    const callData = prepareCallData({
      metadataHash,
      contentHash,
      gateHash,
      appFileId: file.ddocId,
      fileId: file.fileId,
    });
    console.log("Prepared call data");
    logger.debug(`Prepared call data for file ${file.ddocId}`);

    const userOpHash = await this.sendFileOperation(callData);
    console.log("Submitted user op");
    logger.debug(`Submitted user op for file ${file.ddocId}`);
    return {
      userOpHash,
      linkKey: encryptedSecretKey,
      linkKeyNonce: fromUint8Array(nonce),
      commentKey: fromUint8Array(commentKey),
      metadata,
    };
  }

  async submitUpdateFile(file: any) {
    logger.debug(`Submitting update for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const encryptedSecretKey = file.linkKey;
    const nonce = toUint8Array(file.linkKeyNonce);
    const secretKey = toUint8Array(file.secretKey);

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

    const userOpHash = await this.sendFileOperation(callData);
    logger.debug(`Submitted update user op for file ${file.ddocId}`);
    return { userOpHash, metadata };
  }

  async submitDeleteFile(file: any) {
    logger.debug(`Submitting delete for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const callData = prepareDeleteFileCallData({
      onChainFileId: file.onChainFileId,
    });
    const userOpHash = await this.sendFileOperation(callData);
    logger.debug(`Submitted delete user op for file ${file.ddocId}`);
    return { userOpHash };
  }

  async updateFile(file: any) {
    logger.debug(`Updating file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const encryptedSecretKey = file.linkKey;
    const nonce = toUint8Array(file.linkKeyNonce);
    const secretKey = toUint8Array(file.secretKey);

    logger.debug(`Generating encrypted content file for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

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
    logger.debug(`Uploading files to IPFS for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
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
    logger.debug(`Executing file operation for file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

    const { logs } = await this.executeFileOperation(callData);
    const onChainFileId = parseFileEventLog(logs, "EditedFile", EDITED_FILE_EVENT);

    return { onChainFileId, metadata };
  }

  async deleteFile(file: any) {
    logger.debug(`Deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    const callData = prepareDeleteFileCallData({
      onChainFileId: file.onChainFileId,
    });
    logger.debug(`Prepared call data for deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);

    const { logs } = await this.executeFileOperation(callData);
    parseFileEventLog(logs, "DeletedFile", DELETED_FILE_EVENT);
    logger.debug(`Executed file operation for deleting file ${file.ddocId} with onChainFileId ${file.onChainFileId}`);
    return {
      fileId: file.id,
      onChainFileId: file.onChainFileId,
      metadata: file.metadata,
    };
  }
}
