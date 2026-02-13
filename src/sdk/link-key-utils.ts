import { getArgon2idHash } from "@fileverse/crypto/argon";
import hkdf from "futoin-hkdf";
import tweetnacl from "tweetnacl";
import { fromUint8Array, toUint8Array } from "js-base64";

interface LinkKeyMaterialParams {
  ddocId: string;
  linkKey: string | undefined;
  linkKeyNonce: string | undefined;
}

const deriveKeyFromAg2Hash = async (pass: string, salt: Uint8Array) => {
  const key = await getArgon2idHash(pass, salt);

  return hkdf(Buffer.from(key), tweetnacl.secretbox.keyLength, {
    info: Buffer.from("encryptionKey"),
  });
};

const getExistingEncryptionMaterial = async (
  existingEncryptedSecretKey: string,
  existingNonce: string,
  docId: string,
) => {
  const derivedKey = await deriveKeyFromAg2Hash(docId, toUint8Array(existingNonce));
  const secretKey = tweetnacl.secretbox.open(
    toUint8Array(existingEncryptedSecretKey),
    toUint8Array(existingNonce),
    derivedKey,
  );
  return {
    encryptedSecretKey: existingEncryptedSecretKey,
    nonce: toUint8Array(existingNonce),
    secretKey,
    derivedKey: new Uint8Array(derivedKey),
  };
};

const getNaclSecretKey = async (ddocId: string) => {
  const { secretKey } = tweetnacl.box.keyPair();
  const nonce = tweetnacl.randomBytes(tweetnacl.secretbox.nonceLength);

  const derivedKey = await deriveKeyFromAg2Hash(ddocId, nonce);

  const encryptedSecretKey = fromUint8Array(tweetnacl.secretbox(secretKey, nonce, derivedKey), true);

  return { nonce, encryptedSecretKey, secretKey, derivedKey: new Uint8Array(derivedKey) };
};

export const generateLinkKeyMaterial = async (params: LinkKeyMaterialParams) => {
  if (params.linkKeyNonce && params.linkKey) {
    const { encryptedSecretKey, nonce, secretKey, derivedKey } = await getExistingEncryptionMaterial(
      params.linkKey,
      params.linkKeyNonce,
      params.ddocId,
    );
    if (secretKey) return { encryptedSecretKey, nonce, secretKey, derivedKey };
  }
  const { secretKey, nonce, encryptedSecretKey, derivedKey } = await getNaclSecretKey(params.ddocId);

  return { secretKey, nonce, encryptedSecretKey, derivedKey };
};
