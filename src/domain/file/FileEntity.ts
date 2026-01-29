import { uuidv7 } from "uuidv7";
import type { CreateFileInput, UpdateFileInput } from "./types";
import { generate } from "short-uuid";

export class FileEntity {
  constructor(
    readonly id: string,
    readonly ddocId: string,
    readonly title: string,
    readonly content: string,
    readonly portalAddress: string,
    readonly localVersion: number,
    readonly onchainVersion: number,
    readonly syncStatus: string,
    readonly isDeleted: number,
    readonly createdAt: string,
    readonly updatedAt: string,
  ) {}

  static create(input: CreateFileInput): FileEntity {
    const now = new Date().toISOString();
    return new FileEntity(
      uuidv7(),
      generate(),
      input.title,
      input.content,
      input.portalAddress,
      1,
      0,
      'pending',
      0,
      now,
      now,
    );
  }

  withUpdate(payload: UpdateFileInput): FileEntity {
    return new FileEntity(
      this.id,
      this.ddocId,
      payload.title ?? this.title,
      payload.content ?? this.content,
      this.portalAddress,
      this.localVersion + 1,
      this.onchainVersion,
      'pending',
      this.isDeleted,
      this.createdAt,
      new Date().toISOString(),
    );
  }
}
