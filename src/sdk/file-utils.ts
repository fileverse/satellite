import { generateRandomBytes } from "@fileverse/crypto/utils";
import { fromUint8Array, toUint8Array } from "js-base64";
import { gcmEncrypt } from "./file-encryption";
import { toAESKey, aesEncrypt } from "@fileverse/crypto/webcrypto";
import { ADD_FILE_METHOD, DELETED_FILE_ABI, EDIT_FILE_METHOD, UPLOAD_SERVER_URL } from "../constants";
import type { UploadFileAuthParams, FileMetadataParams, UploadFilesParams } from "../types";
import { encodeFunctionData, parseEventLogs, type Abi } from "viem";
import { CHAIN } from "../constants";

export const jsonToFile = (json: any, fileName: string) => {
  const blob = new Blob([JSON.stringify(json)], {
    type: "application/json",
  });

  const file = new File([blob], fileName, {
    type: "application/json",
  });

  return file;
};

const appendAuthTagIvToBlob = async (blob: Blob, authTag: Uint8Array, iv: Uint8Array) => {
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
    toUint8Array(iv),
  );

  return {
    encryptedFile: new File([encryptedBlobWithAuthTagIv], file.name),
    key,
  };
};


export const encryptTitleWithFileKey = async (args: { title: string; key: string }) => {
  const key = await toAESKey(toUint8Array(args.key));
  if (!key) throw new Error("Key is undefined");

  const titleBytes = new TextEncoder().encode(args.title);

  const encryptedTitle = await aesEncrypt(key, titleBytes, "base64");

  return encryptedTitle;
};

interface UploadFileParams {
  file: File;
  ipfsType: string;
  appFileId: string;
}

export type { UploadFileAuthParams };

export const uploadFileToIPFS = async (fileParams: UploadFileParams, authParams: UploadFileAuthParams) => {
  const { file, ipfsType, appFileId } = fileParams;
  const { token, invoker, contractAddress } = authParams;

  const body = new FormData();
  body.append("file", file);
  body.append("ipfsType", ipfsType);
  body.append("appFileId", appFileId);
  body.append("sourceApp", "ddoc");

  const uploadEndpoint = UPLOAD_SERVER_URL + "upload";
  const response = await fetch(uploadEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      contract: contractAddress,
      invoker: invoker,
      chain: String(CHAIN.id),
    },
    body,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error((error as { message: string }).message || "Upload failed");
  }

  const data = (await response.json()) as { ipfsHash: string };
  return data.ipfsHash;
};

const getEditFileTrxCalldata = (args: {
  fileId: number;
  appFileId: string;
  metadataHash: string;
  contentHash: string;
  gateHash: string;
}) => {
  return encodeFunctionData({
    abi: EDIT_FILE_METHOD,
    functionName: "editFile",
    args: [BigInt(args.fileId), args.appFileId, args.metadataHash, args.contentHash, args.gateHash, 2, BigInt(0)],
  });
};

const getAddFileTrxCalldata = (args: {
  appFileId: string;
  metadataHash: string;
  contentHash: string;
  gateHash: string;
}) => {
  return encodeFunctionData({
    abi: ADD_FILE_METHOD,
    functionName: "addFile",
    args: [args.appFileId, 2, args.metadataHash, args.contentHash, args.gateHash, BigInt(0)],
  });
};

export const prepareCallData = (args: {
  metadataHash: string;
  contentHash: string;
  gateHash: string;
  appFileId: string;
  fileId: number | null;
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
};

export const prepareDeleteFileCallData = (args: { onChainFileId: number }) => {
  return encodeFunctionData({
    abi: DELETED_FILE_ABI,
    functionName: "deleteFile",
    args: [BigInt(args.onChainFileId)],
  });
};

export const createEncryptedContentFile = async (content: any) => {
  const contentFile = jsonToFile(
    { file: content, source: "ddoc" },
    `${fromUint8Array(generateRandomBytes(16))}-CONTENT`,
  );
  return encryptFile(contentFile);
};

export type { FileMetadataParams };

export const buildFileMetadata = (params: FileMetadataParams) => ({
  title: params.encryptedTitle,
  size: params.encryptedFileSize,
  mimeType: "application/json",
  appLock: params.appLock,
  ownerLock: params.ownerLock,
  ddocId: params.ddocId,
  nonce: params.nonce,
  owner: params.owner,
  version: "4",
  sourceApp: "fileverse-api",
});

export const parseFileEventLog = (logs: any[], eventName: string, abi: Abi): number => {
  const [parsedLog] = parseEventLogs({ abi, logs, eventName });

  if (!parsedLog) throw new Error(`${eventName} event not found`);

  const fileId = (parsedLog as any).args.fileId;

  if (fileId === undefined || fileId === null) throw new Error("FileId not found in event logs");

  return Number(fileId);
};

export type { UploadFilesParams };

export const uploadAllFilesToIPFS = async (params: UploadFilesParams, authParams: UploadFileAuthParams) => {
  const { metadata, encryptedFile, linkLock, ddocId } = params;

  const [metadataHash, contentHash, gateHash] = await Promise.all([
    uploadFileToIPFS(
      {
        file: jsonToFile(metadata, `${fromUint8Array(generateRandomBytes(16))}-METADATA`),
        ipfsType: "METADATA",
        appFileId: ddocId,
      },
      authParams,
    ),
    uploadFileToIPFS(
      {
        file: encryptedFile,
        ipfsType: "CONTENT",
        appFileId: ddocId,
      },
      authParams,
    ),
    uploadFileToIPFS(
      {
        file: jsonToFile(linkLock, `${fromUint8Array(generateRandomBytes(16))}-GATE`),
        ipfsType: "GATE",
        appFileId: ddocId,
      },
      authParams,
    ),
  ]);

  return { metadataHash, contentHash, gateHash };
};
