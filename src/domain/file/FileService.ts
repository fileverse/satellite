import { FilesRepository } from "../../infra/database/repositories/FilesRepository";
import type { FileEvent } from "../../infra/queue/types";
import type { CreateFileInput, UpdateFileInput } from "./types";
import { FileEntity } from "./FileEntity";

export interface IFileEventsQueue {
  addJob(event: FileEvent, options?: unknown): Promise<void>;
}

export class FileService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly events: IFileEventsQueue,
  ) {}

  async create(
    payload: CreateFileInput
  ): Promise<FileEntity> {
    const file: FileEntity = FileEntity.create(payload);
    const createdFile: FileEntity = this.filesRepository.create(file);
    // push to queue now
    return createdFile;
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
      // TODO: do better
      throw new Error(`file with ddocId ${ddocId} could not be found`);
    }


    const updatedFile: FileEntity = currentFile.withUpdate(payload);
    this.filesRepository.update(updatedFile);

    // await this.events.addJob({
    //   fileId: saved.id,
    //   type: 'update',
    //   metadata: { localVersion: saved.localVersion },
    // });
    
    return updatedFile
  }
}