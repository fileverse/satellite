import { FilesRepository } from "../../infra/database/repositories/FilesRepository";
import { FileEntity } from "./FileEntity";
import { QueueManager } from "../../infra/queue/queueManager";
import { BadRequestError, NotFoundError } from "../../errors";
import type { FileEvent } from "../../infra/queue/types";
import type { CreateFileInput, GetFileParams, ListFilesParams, ListFilesResult, UpdateFileInput } from "./types";

export class FileService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly fileEventsQueue: QueueManager,
  ) { }

  async list(
    params: ListFilesParams,
  ): Promise<ListFilesResult> {
    const response: ListFilesResult = this.filesRepository.list(params);
    return response;
  }

  async get(
    params: GetFileParams,
  ): Promise<FileEntity | null> {
    const file: FileEntity | null = this.filesRepository.get(params);
    if (file === null) {
      return null;
    }
    return file;
  }

  // TODO: remove this awful thing
  /** Get file by internal id, including soft-deleted. */
  async getById(fileId: string): Promise<FileEntity | null> {
    return this.filesRepository.getByIdIncludingDeleted(fileId);
  }

  // TODO: remove this awful thing
  /** Update onchainVersion and/or syncStatus after publish. */
  async updateSyncState(
    fileId: string,
    portalAddress: string,
    payload: { onchainVersion?: number; syncStatus?: string },
  ): Promise<void> {
    this.filesRepository.updateSyncState(fileId, portalAddress, payload);
  }

  async create(
    payload: CreateFileInput
  ): Promise<FileEntity> {
    const file: FileEntity = FileEntity.create(payload);
    this.filesRepository.create(file);

    // add file creation event to queue
    const createFileEvent: FileEvent = {
      fileId: file.id,
      type: 'create',
      metadata: {
        localVersion: file.localVersion,
      },
    }
    await this.fileEventsQueue.addJob(createFileEvent);

    return file;
  }

  async update(
    ddocId: string,
    portal: string,
    payload: UpdateFileInput,
  ): Promise<FileEntity> {
    if (payload.title !== undefined && payload.title.trim().length === 0) {
      throw new BadRequestError('title cannot be empty');
    }

    const params: GetFileParams = { ddocId, portalAddress: portal };
    const currentFile: FileEntity | null = this.filesRepository.get(params);
    if (currentFile === null) {
      throw new NotFoundError(`file with ddocId ${ddocId} could not be found`);
    }

    // TODO: there is no use of creating this deleted instance. 
    const updatedFile: FileEntity = currentFile.withUpdate(payload);
    this.filesRepository.update(updatedFile);

    // add file update event to queue
    const updateFileEvent: FileEvent = {
      fileId: updatedFile.id,
      type: 'update',
      metadata: {
        localVersion: updatedFile.localVersion,
      }
    }
    await this.fileEventsQueue.addJob(updateFileEvent);

    return updatedFile
  }

  async delete(
    params: GetFileParams,
  ): Promise<void> {
    const file: FileEntity | null = await this.get(params);
    if (file === null) {
      throw new NotFoundError(`file with ddocId ${params.ddocId} could not be found`);
    }
    this.filesRepository.delete(file);

    const deleteFileEvent: FileEvent = {
      fileId: file.id,
      type: 'delete',
      metadata: {
        localVersion: file.localVersion,
      }
    }
    await this.fileEventsQueue.addJob(deleteFileEvent);
  }
}
