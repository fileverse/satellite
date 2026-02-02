import { fromUint8Array, toUint8Array } from 'js-base64';
import { KeyStore } from './key-store';
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
} from './file-utils';
import { AgentClient } from './smart-agent';
import { generateAESKey, exportAESKey } from "@fileverse/crypto/webcrypto"
import { config } from '../config';
import { ADDED_FILE_EVENT_ABI, EDITED_FILE_EVENT_ABI } from '../constants';

export class FileManager {
    private keyStore: KeyStore;
    private agentClient: AgentClient;

    constructor(keyStore: KeyStore, agentClient: AgentClient) {
        this.keyStore = keyStore;
        this.agentClient = agentClient;
    }

    private createLocks(
        key: string,
        encryptedSecretKey: string,
        commentKey: Uint8Array
    ) {
        const appLock = {
            lockedFileKey: this.keyStore.encryptData(toUint8Array(key)),
            lockedLinkKey: this.keyStore.encryptData(toUint8Array(encryptedSecretKey)),
            lockedChatKey: this.keyStore.encryptData(commentKey),
        };
        return { appLock, ownerLock: { ...appLock } };
    }

    private async getAuthParams(): Promise<UploadFileAuthParams> {
        return {
            token: await this.keyStore.getAuthToken(config.UPLOAD_SERVER_DID as string),
            contractAddress: this.keyStore.getPortalAddress(),
            invoker: this.agentClient.getAgentAddress(),
        };
    }

    private async executeFileOperation(callData: `0x${string}`) {
        return this.agentClient.executeUserOperationRequest({
            contractAddress: this.keyStore.getPortalAddress(),
            data: callData,
        }, 1000000);
    }

    async addFile(file: any) {
        const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
            ddocId: file.ddocId,
            linkKey: file.linkKey,
            linkKeyNonce: file.linkKeyNonce,
        });

        const { encryptedFile, key } = await createEncryptedContentFile(file.content);
        const commentKey = await exportAESKey(await generateAESKey(128));

        const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
        const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);

        const encryptedTitle = await encryptTitleWithFileKey({ title: file.title || 'Untitled', key });
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
            authParams
        );

        const callData = prepareCallData({
            metadataHash,
            contentHash,
            gateHash,
            appFileId: file.ddocId,
            fileId: file.fileId,
        });

        const { logs } = await this.executeFileOperation(callData);
        const onChainFileId = parseFileEventLog(logs, 'AddedFile', ADDED_FILE_EVENT_ABI);

        return {
            onChainFileId,
            linkKey: fromUint8Array(secretKey),
            linkKeyNonce: fromUint8Array(nonce),
            commentKey: fromUint8Array(commentKey),
            metadata,
        };
    }

    async updateFile(file: any) {
        const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
            ddocId: file.ddocId,
            linkKey: file.linkKey,
            linkKeyNonce: file.linkKeyNonce,
        });

        const { encryptedFile, key } = await createEncryptedContentFile(file.content);
        const commentKey = toUint8Array(file.commentKey);

        const { appLock, ownerLock } = this.createLocks(key, encryptedSecretKey, commentKey);
        const linkLock = buildLinklock(secretKey, toUint8Array(key), commentKey);

        const encryptedTitle = await encryptTitleWithFileKey({ title: file.title || 'Untitled', key });
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
            authParams
        );

        const callData = prepareCallData({
            metadataHash,
            contentHash,
            gateHash,
            appFileId: file.ddocId,
            fileId: file.fileId,
        });

        const { logs } = await this.executeFileOperation(callData);
        const onChainFileId = parseFileEventLog(logs, 'EditedFile', EDITED_FILE_EVENT_ABI);

        return { onChainFileId, metadata };
    }
}
