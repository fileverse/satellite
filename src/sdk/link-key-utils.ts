import { getArgon2idHash } from "@fileverse/crypto/argon";
import hkdf from "futoin-hkdf";
import tweetnacl from "tweetnacl";
import { fromUint8Array, toUint8Array } from "js-base64";
import { bytesToBase64, generateRandomBytes } from "@fileverse/crypto/utils";
import { derivePBKDF2Key, encryptAesCBC } from "@fileverse/crypto/kdf";


interface LinkKeyMaterialParams {
  ddocId: string;
  linkKey: string | undefined;
  linkKeyNonce: string | undefined;
}

const deriveKeyFromAg2Hash = async (pass: string, salt: Uint8Array) => {
  const key = await getArgon2idHash(pass, salt, undefined, {
    m: 16384, // 16 Mb memory usage
    t: 2, // 2 iterations
    p: 8, // 8 threads
    dkLen: 32 // 32 bytes output
  });

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

export const secretBoxEncrypt = (
  messageToEncrypt: Uint8Array,
  secretKey: Uint8Array
) => {
  const nonce = generateRandomBytes(tweetnacl.secretbox.nonceLength);
  const encryptedMessage = tweetnacl.secretbox(
    messageToEncrypt,
    nonce,
    secretKey
  );
  return getNonceAppendedCipherText(nonce, encryptedMessage);
};

export const getNonceAppendedCipherText = (
  nonce: Uint8Array,
  cipherText: Uint8Array
) => {
  return (
    fromUint8Array(nonce, true) +
    "__n__" +
    fromUint8Array(cipherText, true)
  );
};


export const buildLinklock = (key: Uint8Array, fileKey: Uint8Array, commentKey: Uint8Array) => {
  const ikm = generateRandomBytes();
  const kdfSalt = generateRandomBytes();
  const derivedEphermalKey = derivePBKDF2Key(ikm, kdfSalt);

  const { iv, cipherText } = encryptAesCBC(
    {
      key: derivedEphermalKey,
      message: fileKey,
    },
    "base64",
  );

  const { iv: commentIv, cipherText: commentCipherText } = encryptAesCBC(
    {
      key: derivedEphermalKey,
      message: commentKey,
    },
    "base64",
  );

  const encryptedIkm = secretBoxEncrypt(ikm, key);

  const lockedFileKey = iv + "__n__" + cipherText;

  const lockedChatKey = commentIv + "__n__" + commentCipherText;

  const keyMaterial = bytesToBase64(kdfSalt) + "__n__" + encryptedIkm;

  return {
    lockedFileKey: lockedFileKey,
    lockedChatKey: lockedChatKey,
    keyMaterial,
  };
};