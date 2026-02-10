import type { EncodeDeployDataReturnType, Hex } from "viem";

export type DecryptionOptions = { key: string; iv: string; authTag: string };

export interface UploadFileAuthParams {
  token: string;
  invoker: Hex;
  contractAddress: Hex;
}

export interface FileMetadataParams {
  encryptedTitle: string;
  encryptedFileSize: number;
  appLock: Record<string, string>;
  ownerLock: Record<string, string>;
  ddocId: string;
  nonce: string;
  owner: string;
}

export interface UploadFilesParams {
  metadata: Record<string, unknown>;
  encryptedFile: File;
  linkLock: Record<string, string>;
  ddocId: string;
}

export interface IExecuteUserOperationRequest {
  contractAddress: Hex;
  data: EncodeDeployDataReturnType;
}
