import { fromUint8Array } from "js-base64";
import { KeyStore } from "./key-store";
import { generateLinkKeyMaterial, jsonToFile } from "./utils";
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



    }

}