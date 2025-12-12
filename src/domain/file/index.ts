import { generate } from 'short-uuid';

import { FilesModel, File } from '../../infra/database/models';
import { FileEvent, fileEventsQueue } from '../../infra/queue';
import type { ListFilesParams, ListFilesResult, CreateFileInput } from './types';
import type { ClientUpdateFileInput } from '../../interface/api/handlers/ddocs/types';
import type { UpdateFilePayload } from '../../infra/database/models/files/types';
import { del } from '../../interface/api/handlers/ddocs';

function listFiles(params: ListFilesParams): ListFilesResult {
  const { limit, skip } = params;

  const result = FilesModel.findAll(limit, skip);

  return {
    ddocs: result.files,
    total: result.total,
    hasNext: result.hasNext
  };
}

function getFile(ddocId: string): File | null {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  const file = FilesModel.findByDDocId(ddocId);

  if (!file) {
    return null;
  }

  return file;
}

function createFile(input: CreateFileInput): File {
  if (!input.title || !input.content) {
    throw new Error('title and content are required');
  }

  const ddocId = generate();
  const file = FilesModel.create({
    title: input.title,
    content: input.content,
    ddocId: ddocId,
  });

  const createFileEvent: FileEvent = {
    fileId: file._id,
    type: 'create',
    metadata: {
      localVersion: file.localVersion,
    },
  }

  fileEventsQueue.addJob(createFileEvent);
  return file;
}

function updateFile(
  ddocId: string,
  payload: ClientUpdateFileInput,
): File {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  if (!payload.title && !payload.content) {
    throw new Error('At least one field is required: Either provide title, content, or both');
  }

  const existingFile = FilesModel.findByDDocId(ddocId);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const updatePayload: UpdateFilePayload = {
    ...payload,
    localVersion: existingFile.localVersion + 1,
    syncStatus: 'pending', // since the update is done in local db, it's not on the chain yet. hence pending
  };
  const updatedFile = FilesModel.update(existingFile._id, updatePayload);

  const editFileEvent: FileEvent = {
    fileId: updatedFile._id,
    type: 'update',
    metadata: {
      localVersion: updatedFile.localVersion,
    }
  }

  fileEventsQueue.addJob(editFileEvent);
  return updatedFile;
}

function deleteFile(ddocId: string): File {
  if (!ddocId) {
    throw new Error('ddocId is required');
  }

  const existingFile = FilesModel.findByDDocId(ddocId);
  if (!existingFile) {
    throw new Error(`File with ddocId ${ddocId} not found`);
  }

  const deletedFile = FilesModel.softDelete(existingFile._id);

  const deleteFileEvent: FileEvent = {
    fileId: deletedFile._id,
    type: 'delete',
    metadata: {}
  };

  fileEventsQueue.addJob(deleteFileEvent);
  return deletedFile;
}

export { listFiles, getFile, createFile, updateFile, deleteFile };
export type { CreateFileInput, ListFilesParams, ListFilesResult };
