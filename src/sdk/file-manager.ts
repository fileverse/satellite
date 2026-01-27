import { fromUint8Array, toUint8Array } from "js-base64";
import { KeyStore } from "./key-store";
import { buildLinklock, encryptFile, encryptTitleWithFileKey, generateLinkKeyMaterial, jsonToFile } from "./file-utils";
import { randomBytes } from "node:crypto";



export class FileManager {
    private keyStore: KeyStore;

    constructor(keyStore: KeyStore) {
        this.keyStore = keyStore;
    }


    async publishFile(file: any) {
        const { encryptedSecretKey, nonce, secretKey } = await generateLinkKeyMaterial({
            ddocId: file.ddocId,
            linkKey: file.linkKey,
            linkKeyNonce: file.linkKeyNonce,
        });

        const contentFile = jsonToFile(
            { file: file.content, source: 'ddoc' },
            `${fromUint8Array(randomBytes(16))}-CONTENT`)

        const { encryptedFile, key } = await encryptFile(contentFile);


        const title = file.title || 'Untitled';

        const appLock = {
            lockedFileKey: this.keyStore.encryptData(toUint8Array(key)),
            lockedLinkKey: this.keyStore.encryptData(toUint8Array(encryptedSecretKey)),
        }

        const linkLock = buildLinklock(secretKey, key)

        const encryptedTitle = await encryptTitleWithFileKey(title, key)

        const metadata = {
            title: encryptedTitle,
            size: encryptedFile.size,
            mimeType: "application/json",
            appLock,
            ddocId: file.ddocId,
            nonce: fromUint8Array(nonce),
            owner: '',
            version: '4',
        }

        // call upload files
        const metadataHash = ''
        const contentHash = ''
        const gateHash = ''
        // call contract functions
    }
}