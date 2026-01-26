import { getArgon2idHash } from "@fileverse/crypto/dist/argon";
import hkdf from "futoin-hkdf";
import tweetnacl from "tweetnacl";
import { fromUint8Array, toUint8Array } from "js-base64";
import { encryptReadable } from "./file-encryption";
import { type Readable } from "node:stream";


interface LinkKeyMaterialParams {
    ddocId: string;
    linkKey: string | undefined;
    linkKeyNonce: string | undefined;
}


const deriveKeyFromAg2Hash = async (pass: string, salt: Uint8Array) => {
    const key = await getArgon2idHash(pass, salt);

    return hkdf(Buffer.from(key), tweetnacl.secretbox.keyLength, {
        info: Buffer.from('encryptionKey'),
    });
};


const decryptSecretKey = async (
    docId: string,
    nonce: string,
    encryptedSecretKey: string
) => {
    const derivedKey = await deriveKeyFromAg2Hash(docId, toUint8Array(nonce));

    return tweetnacl.secretbox.open(
        toUint8Array(encryptedSecretKey),
        toUint8Array(nonce),
        derivedKey
    );
};

const getExistingEncryptionMaterial = async (
    existingEncryptedSecretKey: string,
    existingNonce: string,
    docId: string
) => {
    const secretKey = await decryptSecretKey(
        docId,
        existingNonce,
        existingEncryptedSecretKey
    );
    return {
        encryptedSecretKey: existingEncryptedSecretKey,
        nonce: toUint8Array(existingNonce),
        secretKey,
    };
};

const getNaclSecretKey = async (ddocId: string) => {
    const { secretKey } = tweetnacl.box.keyPair();
    const nonce = tweetnacl.randomBytes(tweetnacl.secretbox.nonceLength);

    const derivedKey = await deriveKeyFromAg2Hash(ddocId, nonce);

    const encryptedSecretKey = fromUint8Array(
        tweetnacl.secretbox(secretKey, nonce, derivedKey),
        true
    );

    return { nonce, encryptedSecretKey, secretKey };
};


export const generateLinkKeyMaterial = async (params: LinkKeyMaterialParams) => {
    if (params.linkKeyNonce && params.linkKey) {
        const { encryptedSecretKey, nonce, secretKey } =
            await getExistingEncryptionMaterial(
                params.linkKey,
                params.linkKeyNonce,
                params.ddocId
            );
        if (secretKey) return { encryptedSecretKey, nonce, secretKey };
    }
    const { secretKey, nonce, encryptedSecretKey } = await getNaclSecretKey(
        params.ddocId
    );

    return { secretKey, nonce, encryptedSecretKey };
}


export const jsonToFile = (json: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json',
    });

    const file = new File([blob], fileName, {
        type: 'application/json',
    });

    return file;
}


export const encryptFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    const readableStream = new Response(new Uint8Array(arrayBuffer)).body! as unknown as Readable;

    const { stream, decryptionOptions } = encryptReadable(readableStream);

    const { key, iv, authTag } = await decryptionOptions;
    const encryptedBlob = await new Response(stream).blob();



    return { encryptedBlob, decryptionOptions };
}