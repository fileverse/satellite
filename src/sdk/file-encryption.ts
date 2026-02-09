import { gcm } from "@noble/ciphers/aes.js";
import { generateRandomBytes } from "@fileverse/crypto/utils";

const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

const b64ToBytes = (b64: string) => Uint8Array.from(Buffer.from(b64, "base64"));
const bytesToB64 = (b: Uint8Array) => Buffer.from(b).toString("base64");

export type DecryptionOptions = { key: string; iv: string; authTag: string };

export function gcmEncrypt(plaintext: Uint8Array) {
  const key = generateRandomBytes(KEY_LEN);
  const iv = generateRandomBytes(IV_LEN);
  if (key.length !== KEY_LEN) throw new Error("key must be 32 bytes");
  if (iv.length !== IV_LEN) throw new Error("iv must be 12 bytes");

  const out = gcm(key, iv).encrypt(plaintext);
  const ciphertext = out.subarray(0, out.length - TAG_LEN);
  const authTag = out.subarray(out.length - TAG_LEN);

  return {
    ciphertext,
    authTag: bytesToB64(authTag),
    key: bytesToB64(key),
    iv: bytesToB64(iv),
  };
}

export function gcmDecrypt(ciphertext: Uint8Array, opts: DecryptionOptions) {
  const key = b64ToBytes(opts.key);
  const iv = b64ToBytes(opts.iv);
  const tag = b64ToBytes(opts.authTag);
  if (key.length !== KEY_LEN) throw new Error("key must be 32 bytes");
  if (iv.length !== IV_LEN) throw new Error("iv must be 12 bytes");
  if (tag.length !== TAG_LEN) throw new Error("authTag must be 16 bytes");

  const combined = new Uint8Array(ciphertext.length + TAG_LEN);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);

  return gcm(key, iv).decrypt(combined);
}
