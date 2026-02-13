import { EdKeypair, buildAndEncode } from "./ucan";
import type { Hex } from "viem";

export class AuthTokenProvider {
  private readonly DEFAULT_OPTIONS = {
    namespace: "file",
    segment: "CREATE",
    scheme: "storage",
  };
  private keyPair: EdKeypair;
  portalAddress: Hex;
  constructor(keyPair: EdKeypair, portalAddress: Hex) {
    this.keyPair = keyPair;
    this.portalAddress = portalAddress;
  }

  async getAuthToken(
    audienceDid: string,
    options: { namespace: string; segment: string; scheme: string } = this.DEFAULT_OPTIONS,
  ): Promise<string> {
    return buildAndEncode({
      audience: audienceDid,
      issuer: this.keyPair,
      lifetimeInSeconds: 7 * 86400,
      capabilities: [
        {
          with: {
            scheme: options.scheme,
            hierPart: this.portalAddress.toLocaleLowerCase(),
          },
          can: { namespace: options.namespace, segments: [options.segment] },
        },
      ],
    });
  }
}
