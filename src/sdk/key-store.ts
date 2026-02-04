import { Hex } from 'viem';
import {
  eciesDecrypt,
  eciesEncrypt,
  generateECKeyPair,
} from '@fileverse/crypto/ecies';
import * as ucans from '@ucans/ucans';


export class AuthTokenProvider {

  private keyPair: ucans.EdKeypair;
  private portalAddress: Hex;
  constructor(keyPair: ucans.EdKeypair, portalAddress: Hex) {
    this.keyPair = keyPair;
    this.portalAddress = portalAddress;
  }

  async getAuthToken(audienceDid: string,) {

    const ucan = await ucans.build({
      audience: audienceDid,
      issuer: this.keyPair,
      lifetimeInSeconds: 7 * 86400,
      capabilities: [
        {
          with: {
            scheme: 'storage',
            hierPart: this.portalAddress.toLocaleLowerCase(),
          },
          can: { namespace: 'file', segments: ['CREATE'] },
        },
      ],
    });

    return ucans.encode(ucan);
  }
}

export class KeyStore {
  private portalKeySeed: Uint8Array | undefined;
  private portalAddress: Hex | undefined;

  constructor(seed: Uint8Array, address: Hex, private readonly authTokenProvider: AuthTokenProvider) {
    this.portalKeySeed = seed;
    this.portalAddress = address;
    this.authTokenProvider = authTokenProvider;
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

    const keyPair = generateECKeyPair(this.portalKeySeed);
    return keyPair.publicKey;
  }

  private getAppDecryptionKey() {
    if (!this.portalKeySeed) {
      throw new Error('Portal key seed is not set');
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
    return this.authTokenProvider.getAuthToken(audienceDid);
  }
}
