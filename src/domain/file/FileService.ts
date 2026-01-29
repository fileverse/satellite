import { FilesRepository } from "../../infra/database/repositories/FilesRepository";
import type { FileEvent } from "../../infra/queue/types";
import type { UpdateFileInput } from "./types";
import { FileEntity } from "./FileEntity";

export interface IFileEventsQueue {
  addJob(event: FileEvent, options?: unknown): Promise<void>;
}

export class FileService {
  constructor(
    private readonly filesRepository: FilesRepository,
    private readonly events: IFileEventsQueue,
  ) {}

  async update(
    ddocId: string,
    payload: UpdateFileInput,
    portal: string,
  ): Promise<FileEntity> {
    const fileRow = this.filesRepository.findByDDocId(ddocId, portal);
    if (!fileRow) {
      throw new Error(`File with ddocId ${ddocId} not found`);
    }

    const file = new FileEntity(fileRow);
    const updated = file.withUpdate(payload).bumpLocalVersion();
    const savedRow = this.filesRepository.update(updated.toRow());
    const saved = new FileEntity(savedRow);

    await this.events.addJob({
      fileId: saved.id,
      type: 'update',
      metadata: { localVersion: saved.localVersion },
    });

    return saved;
  }
}