import * as ucans from '@ucans/ucans';
import type { Hex } from 'viem';



export class AuthTokenProvider {
    private readonly DEFAULT_OPTIONS = { namespace: 'file', segment: 'CREATE', scheme: 'storage' };
    private keyPair: ucans.EdKeypair;
    private portalAddress: Hex;
    constructor(keyPair: ucans.EdKeypair, portalAddress: Hex) {
        this.keyPair = keyPair;
        this.portalAddress = portalAddress;
    }

    async getAuthToken(audienceDid: string, options: { namespace: string, segment: string, scheme: string } = this.DEFAULT_OPTIONS): Promise<string> {
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