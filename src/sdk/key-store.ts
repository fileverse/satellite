import { eciesDecrypt, eciesEncrypt, generateECKeyPair } from "@fileverse/crypto/ecies";
import { AuthTokenProvider } from "./auth-token-provider";

export class KeyStore {
  private portalKeySeed: Uint8Array | undefined;

  constructor(
    seed: Uint8Array,
    private readonly authTokenProvider: AuthTokenProvider,
  ) {
    this.portalKeySeed = seed;
    this.authTokenProvider = authTokenProvider;
  }

  getPortalAddress() {
    return this.authTokenProvider.portalAddress;
  }

  private getAppEncryptionKey() {
    if (!this.portalKeySeed) {
      throw new Error("Portal key seed is not set");
    }

    const keyPair = generateECKeyPair(this.portalKeySeed);
    return keyPair.publicKey;
  }

  private getAppDecryptionKey() {
    if (!this.portalKeySeed) {
      throw new Error("Portal key seed is not set");
    }

    const keyPair = generateECKeyPair(this.portalKeySeed);
    return keyPair.privateKey;
  }

  encryptData(data: Uint8Array) {
    return eciesEncrypt(this.getAppEncryptionKey(), data);
  }

  decryptData(data: string) {
    return eciesDecrypt(this.getAppDecryptionKey(), data);
  }

  getAuthToken(audienceDid: string) {
    return this.authTokenProvider.getAuthToken(audienceDid, AuthTokenProvider.FILE_CREATE_OPTIONS);
  }
}
