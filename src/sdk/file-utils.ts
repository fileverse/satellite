import { getArgon2idHash } from '@fileverse/crypto/argon';
import {
    bytesToBase64,
    generateRandomBytes,
} from '@fileverse/crypto/utils';
import { derivePBKDF2Key, encryptAesCBC } from '@fileverse/crypto/kdf';
import { secretBoxEncrypt } from '@fileverse/crypto/nacl';
import hkdf from 'futoin-hkdf';

import tweetnacl from 'tweetnacl';
import { fromUint8Array, toUint8Array } from 'js-base64';
import { gcmEncrypt } from './file-encryption';
import { toAESKey, aesEncrypt } from '@fileverse/crypto/webcrypto';
import axios from 'axios';
import { ADD_FILE_ABI, DELETED_FILE_ABI, EDIT_FILE_ABI, UPLOAD_SERVER_URL } from '../constants';
import { encodeFunctionData, type Hex, parseEventLogs, type Abi } from 'viem';


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

export const generateLinkKeyMaterial = async (
    params: LinkKeyMaterialParams
) => {
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
};

export const jsonToFile = (json: any, fileName: string) => {
    const blob = new Blob([JSON.stringify(json)], {
        type: 'application/json',
    });

    const file = new File([blob], fileName, {
        type: 'application/json',
    });

    return file;
};

const appendAuthTagIvToBlob = async (
    blob: Blob,
    authTag: Uint8Array,
    iv: Uint8Array
) => {
    const encryptedFileBytes = await blob.arrayBuffer();
    const encryptedBytes = new Uint8Array(encryptedFileBytes);
    const combinedLength = encryptedBytes.length + authTag.length + iv.length;
    const combinedArray = new Uint8Array(combinedLength);

    let offset = 0;
    combinedArray.set(encryptedBytes, offset);
    offset += encryptedBytes.length;

    combinedArray.set(authTag, offset);
    offset += authTag.length;

    combinedArray.set(iv, offset);

    return new Blob([combinedArray], { type: blob.type });
};

export const encryptFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();

    const plaintext = new Uint8Array(arrayBuffer);

    const { ciphertext, authTag, key, iv } = gcmEncrypt(plaintext);

    const encryptedBlob = new Blob([ciphertext], { type: file.type });

    const encryptedBlobWithAuthTagIv = await appendAuthTagIvToBlob(
        encryptedBlob,
        toUint8Array(authTag),
        toUint8Array(iv)
    );

    return {
        encryptedFile: new File([encryptedBlobWithAuthTagIv], file.name),
        key,
    };
};

export const getNonceAppendedCipherText = (
    nonce: Uint8Array,
    cipherText: Uint8Array
) => {
    return (
        fromUint8Array(nonce, true) +
        '__n__' +
        fromUint8Array(cipherText, true)
    );
};

export const jsonToBytes = (json: Record<string, any>) =>
    new TextEncoder().encode(JSON.stringify(json));

export const buildLinklock = (key: Uint8Array, fileKey: Uint8Array, commentKey: Uint8Array) => {
    const ikm = generateRandomBytes();
    const kdfSalt = generateRandomBytes();
    const derivedEphermalKey = derivePBKDF2Key(ikm, kdfSalt);

    const { iv, cipherText } = encryptAesCBC(
        {
            key: derivedEphermalKey,
            message: fileKey,
        },
        'base64'
    );

    const { iv: commentIv, cipherText: commentCipherText } = encryptAesCBC(
        {
            key: derivedEphermalKey,
            message: commentKey,
        },
        'base64'
    );

    const encryptedIkm = secretBoxEncrypt(ikm, key);

    const lockedFileKey = iv + '__n__' + cipherText;

    const lockedChatKey = commentIv + '__n__' + commentCipherText;

    const keyMaterial = bytesToBase64(kdfSalt) + '__n__' + encryptedIkm;


    const fileKeyNonce = generateRandomBytes(24)
    const encryptedFileKey = tweetnacl.secretbox(
        jsonToBytes({ key: fromUint8Array(fileKey) }),
        fileKeyNonce,
        key
    );


    const chatKeyNonce = generateRandomBytes(24)
    const encryptedChatKey = tweetnacl.secretbox(
        commentKey,
        chatKeyNonce,
        key
    );

    return {
        lockedFileKey: getNonceAppendedCipherText(fileKeyNonce, encryptedFileKey),
        lockedChatKey: getNonceAppendedCipherText(chatKeyNonce, encryptedChatKey),
        lockedFileKey_v2: lockedFileKey,
        lockedChatKey_v2: lockedChatKey,
        keyMaterial
    };
};

export const encryptTitleWithFileKey = async (args: {
    title: string;
    key: string;
}) => {
    const key = await toAESKey(toUint8Array(args.key));
    if (!key) throw new Error('Key is undefined');

    const titleBytes = new TextEncoder().encode(args.title);

    const encryptedTitle = await aesEncrypt(key, titleBytes, 'base64');

    return encryptedTitle;
};

interface UploadFileParams {
    file: File,
    ipfsType: string,
    appFileId: string,
}

export interface UploadFileAuthParams {
    token: string,
    invoker: Hex,
    contractAddress: Hex,
}

export const uploadFileToIPFS = async (
    fileParams: UploadFileParams,
    authParams: UploadFileAuthParams
) => {
    const { file, ipfsType, appFileId } = fileParams;
    const { token, invoker, contractAddress } = authParams;

    const body = new FormData();
    body.append('file', file);
    body.append('ipfsType', ipfsType);
    body.append('appFileId', appFileId);

    body.append('sourceApp', 'ddoc');
    const uploadEndpoint = UPLOAD_SERVER_URL + 'upload';
    const response = await axios.post(
        uploadEndpoint,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                contract: contractAddress,
                invoker: invoker,
                chain: process.env.chainId,
            },
        }
    );

    return response.data.ipfsHash;
};


const getEditFileTrxCalldata = (args: {
    fileId: number;
    appFileId: string;
    metadataHash: string;
    contentHash: string;
    gateHash: string;
}) => {
    return encodeFunctionData({
        abi: EDIT_FILE_ABI,
        functionName: 'editFile',
        args: [BigInt(args.fileId),
        args.appFileId,
        args.metadataHash,
        args.contentHash,
        args.gateHash,
            2,
        BigInt(0)]
    })
}

const getAddFileTrxCalldata = (args: {
    appFileId: string;
    metadataHash: string;
    contentHash: string;
    gateHash: string;
}) => {
    return encodeFunctionData({
        abi: ADD_FILE_ABI,
        functionName: 'addFile',
        args: [args.appFileId, 2, args.metadataHash, args.contentHash, args.gateHash, BigInt(0)]
    })
}


export const prepareCallData = (args: {
    metadataHash: string;
    contentHash: string;
    gateHash: string;
    appFileId: string,
    fileId?: number
}) => {

    if (args.fileId) {
        return getEditFileTrxCalldata({
            fileId: args.fileId,
            appFileId: args.appFileId,
            metadataHash: args.metadataHash,
            contentHash: args.contentHash,
            gateHash: args.gateHash,
        });
    }
    return getAddFileTrxCalldata(args);

}

export const prepareDeleteFileCallData = (args: { onChainFileId: number }) => {
    return encodeFunctionData({
        abi: DELETED_FILE_ABI,
        functionName: 'deleteFile',
        args: [BigInt(args.onChainFileId)]
    })
}

export const createEncryptedContentFile = async (content: any) => {
    const contentFile = jsonToFile(
        { file: content, source: 'ddoc' },
        `${fromUint8Array(generateRandomBytes(16))}-CONTENT`
    );
    return encryptFile(contentFile);
};

export interface FileMetadataParams {
    encryptedTitle: string;
    encryptedFileSize: number;
    appLock: Record<string, string>;
    ownerLock: Record<string, string>;
    ddocId: string;
    nonce: string;
    owner: string;
}

export const buildFileMetadata = (params: FileMetadataParams) => ({
    title: params.encryptedTitle,
    size: params.encryptedFileSize,
    mimeType: 'application/json',
    appLock: params.appLock,
    ownerLock: params.ownerLock,
    ddocId: params.ddocId,
    nonce: params.nonce,
    owner: params.owner,
    version: '4',
    sourceApp: 'satellite'
});

export const parseFileEventLog = (
    logs: any[],
    eventName: string,
    abi: Abi
): number => {
    const [parsedLog] = parseEventLogs({ abi, logs, eventName });

    if (!parsedLog)
        throw new Error(`${eventName} event not found`);

    const fileId = (parsedLog as any).args.fileId;

    if (fileId === undefined || fileId === null)
        throw new Error('FileId not found in event logs');

    return Number(fileId);
};

export interface UploadFilesParams {
    metadata: Record<string, any>;
    encryptedFile: File;
    linkLock: Record<string, string>;
    ddocId: string;
}

export const uploadAllFilesToIPFS = async (
    params: UploadFilesParams,
    authParams: UploadFileAuthParams
) => {
    const { metadata, encryptedFile, linkLock, ddocId } = params;

    const [metadataHash, contentHash, gateHash] = await Promise.all([
        uploadFileToIPFS({
            file: jsonToFile(metadata, `${fromUint8Array(generateRandomBytes(16))}-METADATA`),
            ipfsType: 'METADATA',
            appFileId: ddocId,
        }, authParams),
        uploadFileToIPFS({
            file: encryptedFile,
            ipfsType: 'CONTENT',
            appFileId: ddocId,
        }, authParams),
        uploadFileToIPFS({
            file: jsonToFile(linkLock, `${fromUint8Array(generateRandomBytes(16))}-GATE`),
            ipfsType: 'GATE',
            appFileId: ddocId,
        }, authParams),
    ]);

    return { metadataHash, contentHash, gateHash };
};