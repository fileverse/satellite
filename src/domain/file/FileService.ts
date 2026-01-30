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
    const file: FileEntity = new FileEntity(payload);
    const createdFile: FileEntity = this.filesRepository.create(file);
    // push to queue now
    return createdFile;
  }

  async update(
    ddocId: string,
    portal: string,
    payload: UpdateFileInput,
  ): Promise<FileEntity> { // TODO: is return type correct here? What to return in case of errors?
    // TODO: verify if this works without await, it should because this is better-sqlite3
    const currentFile: FileEntity | null = this.filesRepository.findByDDocId(ddocId, portal);
    if (!currentFile) {
      // TODO: do better
      throw new Error(`file with ddocId ${ddocId} could not be found`);
    }

    const updatedFile: FileEntity = currentFile.withUpdate(payload).bumpLocalVersion();
    this.filesRepository.update(updatedFile);

    // await this.events.addJob({
    //   fileId: saved.id,
    //   type: 'update',
    //   metadata: { localVersion: saved.localVersion },
    // });
    
    return updatedFile
  }
}