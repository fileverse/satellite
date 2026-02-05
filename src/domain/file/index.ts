import { generate } from 'short-uuid';

import {
  ActivityModel,
  EventsModel,
  FilesModel,
  type File,
} from '../../infra/database/models';
import { DEFAULT_LIST_LIMIT } from './constants';

import type {
  ListFilesParams,
  ListFilesResult,
  CreateFileInput,
  UpdateFileInput,
} from './types';
import type { UpdateFilePayload } from '../../infra/database/models/files/types';

function listFiles(params: ListFilesParams): ListFilesResult {
  const { limit, skip, portalAddress } = params;
  const effectiveLimit = limit || DEFAULT_LIST_LIMIT;

  const result = FilesModel.findAll(portalAddress, effectiveLimit, skip);

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

interface GetFileResult {
  ddocId: string;
  link: string;
  title: string;
  content: string;
  localVersion: number;
  onchainVersion: number;
  syncStatus: string;
  isDeleted: number;
  onChainFileId: number | null;
  portalAddress: string;
  createdAt: string;
  updatedAt: string;
}

function getFile(ddocId: string, portalAddress: string): GetFileResult | null {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  const file = FilesModel.findByDDocId(ddocId, portalAddress);

  if (!file) {
    return null;
  }

  return {
    ddocId: file.ddocId,
    link: file.link || '',
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

async function createFile(input: CreateFileInput): Promise<File> {
  if (!input.title || !input.content || !input.portalAddress) {
    throw new Error('title, content, and portalAddress are required');
  }

  const ddocId = generate();
  const file = FilesModel.create({
    title: input.title,
    content: input.content,
    ddocId: ddocId,
    portalAddress: input.portalAddress,
  });

  EventsModel.create({ type: 'create', fileId: file._id });
  if (input.apiKeyName) {
    ActivityModel.create({
      type: 'add-file',
      apiKeyName: input.apiKeyName,
      portalAddress: input.portalAddress,
      fileId: file._id,
      documentTitle: file.title,
    });
  }
  return file;
}

async function updateFile(
  ddocId: string,
  payload: UpdateFileInput,
  portalAddress: string,
  apiKeyName?: string
): Promise<Partial<File>> {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  if (!payload.title && !payload.content) {
    throw new Error(
      'At least one field is required: Either provide title, content, or both'
    );
  }

  const existingFile = FilesModel.findByDDocId(ddocId, portalAddress);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const updatePayload: UpdateFilePayload = {
    ...payload,
    localVersion: existingFile.localVersion + 1,
    syncStatus: 'pending', // since the update is done in local db, it's not on the chain yet. hence pending
  };
  const updatedFile = FilesModel.update(existingFile._id, updatePayload, portalAddress);

  EventsModel.create({ type: 'update', fileId: updatedFile._id });
  if (apiKeyName) {
    ActivityModel.create({
      type: 'edit-file',
      apiKeyName,
      portalAddress,
      fileId: updatedFile._id,
      documentTitle: updatedFile.title,
    });
  }
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
  };
}

async function deleteFile(
  ddocId: string,
  portalAddress: string,
  apiKeyName?: string
): Promise<File> {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  const existingFile = FilesModel.findByDDocId(ddocId, portalAddress);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const deletedFile = FilesModel.softDelete(existingFile._id);

  EventsModel.create({ type: 'delete', fileId: deletedFile._id });
  if (apiKeyName) {
    ActivityModel.create({
      type: 'delete-file',
      apiKeyName,
      portalAddress,
      fileId: deletedFile._id,
      documentTitle: deletedFile.title,
    });
  }
  return deletedFile;
}

export { listFiles, getFile, createFile, updateFile, deleteFile };
export type {
  CreateFileInput,
  UpdateFileInput,
  ListFilesParams,
  ListFilesResult,
};
