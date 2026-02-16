import * as ucans from "@ucans/ucans";
import type { Hex } from "viem";

export class AuthTokenProvider {
  static readonly FILE_CREATE_OPTIONS = {
    namespace: "file",
    segment: "CREATE",
    scheme: "storage",
  };
  static readonly PROXY_AUTH_OPTIONS = {
    namespace: "proxy",
    segment: "ACCESS",
    scheme: "pimlico",
  };
  private keyPair: ucans.EdKeypair;
  portalAddress: Hex;
  constructor(keyPair: ucans.EdKeypair, portalAddress: Hex) {
    this.keyPair = keyPair;
    this.portalAddress = portalAddress;
  }

  async getAuthToken(
    audienceDid: string,
    options: { namespace: string; segment: string; scheme: string } = AuthTokenProvider.FILE_CREATE_OPTIONS,
  ): Promise<string> {
    const ucan = await ucans.build({
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

    return ucans.encode(ucan);
  }
}
