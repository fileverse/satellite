import { FilesRepository } from "../../infra/database/repositories/FilesRepository";
import type { FileEvent } from "../../infra/queue/types";
import { fileEventsQueue } from "../../infra/queue";
import type { CreateFileInput, UpdateFileInput } from "./types";
import { FileEntity } from "./FileEntity";
import {QueueManager} from "../../infra/queue/queueManager";

export interface IFileEventsQueue {
  addJob(event: FileEvent, options?: unknown): Promise<void>;
}

export class FileService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly fileEventsQueue: QueueManager,
  ) {}

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
      throw new Error('title cannot be empty');
    }

    const currentFile: FileEntity | null = this.filesRepository.findByDDocId(ddocId, portal);
    if (currentFile === null) {
      // TODO: do better error handling
      throw new Error(`file with ddocId ${ddocId} could not be found`);
    }

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
}