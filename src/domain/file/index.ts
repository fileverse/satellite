import { generate } from "short-uuid";
import { fromUint8Array } from "js-base64";

import { EventsModel, FilesModel } from "../../infra/database/models";
import type {
  File,
  ListFilesParams,
  ListFilesResult,
  CreateFileInput,
  UpdateFileInput,
  UpdateFilePayload,
  GetFileResult,
} from "../../types";
import { DEFAULT_LIST_LIMIT } from "./constants";
import { generateLinkKeyMaterial } from "../../sdk/file-utils";

async function listFiles(params: ListFilesParams): Promise<ListFilesResult> {
  const { limit, skip, portalAddress } = params;
  const effectiveLimit = limit || DEFAULT_LIST_LIMIT;

  const result = await FilesModel.findAll(portalAddress, effectiveLimit, skip);

  const processedFiles = result.files.map((file) => ({
    ddocId: file.ddocId,
    link: file.link,
    title: file.title,
    content: file.content,
    localVersion: file.localVersion,
    onchainVersion: file.onchainVersion,
    syncStatus: file.syncStatus,
    isDeleted: file.isDeleted,
    onChainFileId: file.onChainFileId,
    portalAddress: file.portalAddress,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  }));

  return {
    ddocs: processedFiles,
    total: result.total,
    hasNext: result.hasNext,
  };
}

async function getFile(ddocId: string, portalAddress: string): Promise<GetFileResult | null> {
  if (!ddocId) {
    throw new Error("ddocId is required");
  }

  const file = await FilesModel.findByDDocId(ddocId, portalAddress);

  if (!file) {
    return null;
  }

  return {
    ddocId: file.ddocId,
    link: file.link || "",
    title: file.title,
    content: file.content,
    localVersion: file.localVersion,
    onchainVersion: file.onchainVersion,
    syncStatus: file.syncStatus,
    isDeleted: file.isDeleted,
    onChainFileId: file.onChainFileId,
    portalAddress: file.portalAddress,
    createdAt: file.createdAt,
    updatedAt: file.updatedAt,
  };
}

const createFile = async (input: CreateFileInput): Promise<File> => {
  if (!input.title || !input.content || !input.portalAddress) {
    throw new Error("title, content, and portalAddress are required");
  }

  const ddocId = generate();

  const { encryptedSecretKey, nonce, secretKey, derivedKey } = await generateLinkKeyMaterial({
    ddocId: ddocId,
    linkKey: undefined,
    linkKeyNonce: undefined,
  });

  const file = await FilesModel.create({
    title: input.title,
    content: input.content,
    ddocId: ddocId,
    portalAddress: input.portalAddress,
    linkKey: encryptedSecretKey,
    linkKeyNonce: fromUint8Array(nonce),
    derivedKey: fromUint8Array(derivedKey),
    secretKey: fromUint8Array(secretKey),
  });

  await EventsModel.create({ type: "create", fileId: file._id, portalAddress: file.portalAddress });
  return file;
};

const updateFile = async (ddocId: string, payload: UpdateFileInput, portalAddress: string): Promise<Partial<File>> => {
  if (!ddocId) {
    throw new Error("ddocId is required");
  }

  if (!payload.title && !payload.content) {
    throw new Error("At least one field is required: Either provide title, content, or both");
  }

  const existingFile = await FilesModel.findByDDocId(ddocId, portalAddress);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const updatePayload: UpdateFilePayload = {
    ...payload,
    localVersion: existingFile.localVersion + 1,
    syncStatus: "pending", // since the update is done in local db, it's not on the chain yet. hence pending
  };
  const updatedFile = await FilesModel.update(existingFile._id, updatePayload, portalAddress);

  await EventsModel.create({ type: "update", fileId: updatedFile._id, portalAddress: updatedFile.portalAddress });
  return {
    ddocId: updatedFile.ddocId,
    link: updatedFile.link,
    title: updatedFile.title,
    content: updatedFile.content,
    localVersion: updatedFile.localVersion,
    onchainVersion: updatedFile.onchainVersion,
    syncStatus: updatedFile.syncStatus,
    isDeleted: updatedFile.isDeleted,
    onChainFileId: updatedFile.onChainFileId,
    portalAddress: updatedFile.portalAddress,
    createdAt: updatedFile.createdAt,
    updatedAt: updatedFile.updatedAt,
  };
};

const deleteFile = async (ddocId: string, portalAddress: string): Promise<File> => {
  if (!ddocId) {
    throw new Error("ddocId is required");
  }

  const existingFile = await FilesModel.findByDDocId(ddocId, portalAddress);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const deletedFile = await FilesModel.softDelete(existingFile._id);

  await EventsModel.create({ type: "delete", fileId: deletedFile._id, portalAddress: deletedFile.portalAddress });
  return deletedFile;
};

export { listFiles, getFile, createFile, updateFile, deleteFile };
export type { CreateFileInput, UpdateFileInput, ListFilesParams, ListFilesResult, GetFileResult } from "../../types";
