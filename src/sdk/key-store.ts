import { Hex } from "viem";
import { eciesDecrypt, eciesEncrypt, generateECKeyPair } from "@fileverse/crypto";


export class KeyStore {
    private portalKeySeed: Uint8Array | undefined;
    private portalAddress: Hex | undefined;

    constructor(seed: Uint8Array, address: Hex) {
        this.portalKeySeed = seed;
        this.portalAddress = address;
    }

    getPortalAddress() {
        if (!this.portalAddress) {
            throw new Error('Portal address is not set');
        }
        return this.portalAddress;
    }

    private getAppEncryptionKey() {
        if (!this.portalKeySeed) {
            throw new Error('Portal key seed is not set');
        }

        const keyPair = generateECKeyPair((this.portalKeySeed));
        return keyPair.publicKey;
    }

    private getAppDecryptionKey() {
        if (!this.portalKeySeed) {
            throw new Error('Portal key seed is not set');
        }

        const keyPair = generateECKeyPair((this.portalKeySeed));
        return keyPair.privateKey;
    }

    encryptData(data: Uint8Array) {
        return eciesEncrypt(this.getAppEncryptionKey(), data);
    }

    decryptData(data: string) {
        return eciesDecrypt(this.getAppDecryptionKey(), data);
    }

}