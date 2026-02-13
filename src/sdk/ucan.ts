import { sign, extractPublicKeyFromSecretKey } from "@stablelib/ed25519";
import { toUint8Array } from "js-base64";

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const EDWARDS_DID_PREFIX = new Uint8Array([0xed, 0x01]);

function base58btcEncode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let result = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result += BASE58_ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i--) {
    result += BASE58_ALPHABET[digits[i]];
  }
  return result;
}

function base64urlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export class EdKeypair {
  readonly jwtAlg = "EdDSA";
  private secretKey: Uint8Array;
  private publicKey: Uint8Array;

  private constructor(secretKey: Uint8Array, publicKey: Uint8Array) {
    this.secretKey = secretKey;
    this.publicKey = publicKey;
  }

  static fromSecretKey(key: string): EdKeypair {
    const secretKey = toUint8Array(key);
    const publicKey = extractPublicKeyFromSecretKey(secretKey);
    return new EdKeypair(secretKey, publicKey);
  }

  did(): string {
    const bytes = new Uint8Array(EDWARDS_DID_PREFIX.length + this.publicKey.length);
    bytes.set(EDWARDS_DID_PREFIX);
    bytes.set(this.publicKey, EDWARDS_DID_PREFIX.length);
    return "did:key:z" + base58btcEncode(bytes);
  }

  async sign(msg: Uint8Array): Promise<Uint8Array> {
    return sign(this.secretKey, msg);
  }
}

interface Capability {
  with: { scheme: string; hierPart: string };
  can: { namespace: string; segments: string[] };
}

interface BuildParams {
  issuer: EdKeypair;
  audience: string;
  capabilities?: Capability[];
  lifetimeInSeconds?: number;
  expiration?: number;
  notBefore?: number;
  facts?: Record<string, unknown>[];
  proofs?: string[];
}

export async function buildAndEncode(params: BuildParams): Promise<string> {
  const {
    issuer,
    audience,
    capabilities = [],
    lifetimeInSeconds = 30,
    expiration,
    notBefore,
    facts,
    proofs = [],
  } = params;

  const currentTime = Math.floor(Date.now() / 1000);
  const exp = expiration ?? currentTime + lifetimeInSeconds;

  const header = { alg: issuer.jwtAlg, typ: "JWT", ucv: "0.8.1" };

  const att = capabilities.map((cap) => ({
    with: `${cap.with.scheme}:${cap.with.hierPart}`,
    can: [cap.can.namespace, ...cap.can.segments].join("/"),
  }));

  const payload: Record<string, unknown> = {
    iss: issuer.did(),
    aud: audience,
    exp,
    att,
    prf: proofs,
  };

  if (notBefore !== undefined) payload.nbf = notBefore;
  if (facts !== undefined) payload.fct = facts;

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signedData = `${encodedHeader}.${encodedPayload}`;

  const sig = await issuer.sign(new TextEncoder().encode(signedData));
  const signature = base64urlEncode(sig);

  return `${signedData}.${signature}`;
}
