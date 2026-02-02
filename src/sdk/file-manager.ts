import { fromUint8Array, toUint8Array } from 'js-base64';
import { KeyStore } from './key-store';
import {
    buildLinklock,
    encryptFile,
    encryptTitleWithFileKey,
    generateLinkKeyMaterial,
    jsonToFile,
    prepareCallData,
    uploadFileToIPFS,
} from './file-utils';
import { randomBytes } from 'node:crypto';
import { AgentClient } from './smart-agent';

export class FileManager {
    private keyStore: KeyStore;

    constructor(keyStore: KeyStore) {
        this.keyStore = keyStore;
    }

    async publishFile(file: any, agentClient: AgentClient) {
        const { encryptedSecretKey, nonce, secretKey } =
            await generateLinkKeyMaterial({
                ddocId: file.ddocId,
                linkKey: file.linkKey,
                linkKeyNonce: file.linkKeyNonce,
            });

        const contentFile = jsonToFile(
            { file: file.content, source: 'ddoc' },
            `${fromUint8Array(randomBytes(16))}-CONTENT`
        );

        const { encryptedFile, key } = await encryptFile(contentFile);

        const title = file.title || 'Untitled';

        const appLock = {
            lockedFileKey: this.keyStore.encryptData(toUint8Array(key)),
            lockedLinkKey: this.keyStore.encryptData(
                toUint8Array(encryptedSecretKey)
            ),
        };

        const linkLock = buildLinklock(secretKey, key);

        const encryptedTitle = await encryptTitleWithFileKey({ title, key });

        const metadata = {
            title: encryptedTitle,
            size: encryptedFile.size,
            mimeType: 'application/json',
            appLock,
            ddocId: file.ddocId,
            nonce: fromUint8Array(nonce),
            owner: agentClient.getAgentAddress(),
            version: '4',
            sourceApp: 'satellite'
        };

        // call upload files
        const metadataHash = await uploadFileToIPFS(
            jsonToFile(metadata, `${fromUint8Array(randomBytes(16))}-METADATA`),
            'METADATA',
            file.ddocId,
            this.keyStore,
            agentClient.getAgentAddress()
        );
        const contentHash = await uploadFileToIPFS(
            encryptedFile,
            'CONTENT',
            file.ddocId,
            this.keyStore,
            agentClient.getAgentAddress()
        );
        const gateHash = await uploadFileToIPFS(
            jsonToFile(linkLock, `${fromUint8Array(randomBytes(16))}-GATE`),
            'GATE',
            file.ddocId,
            this.keyStore,
            agentClient.getAgentAddress()
        );

        const callData = prepareCallData({
            metadataHash,
            contentHash,
            gateHash,
            appFileId: file.appFileId,
            fileId: file.fileId,
        });

        const trx = await agentClient.executeUserOperationRequest({
            contractAddress: this.keyStore.getPortalAddress(),
            data: callData,
        }, 1000000);

        return trx;
    }
}
