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
    paylod: CreateFileInput,
  ): Promise<FileEntity> {
    // i only know/understand entity
    // Right now, FileEntity takes a row when instantiated.
    // This is wrong. 
    // FileEntity should not depend or be created from a row.
    // It should be created from the arguments it is provided with.
    // The only job of the Row thing is to represent a row in the database. 
    // So we need to create FileEntity from CreateFileInput
    // It has the necessary fields and values for creating a File. 
    // For the remaining fields, there will be default values.
    // Like for newly created File, localVersion is 1, onchainVersion is 0, sync state is pending.. and so on
    const file: FileEntity = new FileEntity()
    this.filesRepository.create(file)
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