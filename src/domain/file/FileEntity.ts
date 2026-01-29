import { FileRow } from "../../infra/database/repositories/FileRow";
import type { UpdateFileInput } from "./types";

export class FileEntity {
  constructor(private readonly row: FileRow) {}

  get id() { return this.row._id; }
  get ddocId() { return this.row.ddocId; }
  get title() { return this.row.title; }
  get content() { return this.row.content; }
  get portalAddress() { return this.row.portalAddress; }
  get localVersion() { return this.row.localVersion; }
  get onchainVersion() { return this.row.onchainVersion; }
  get syncStatus() { return this.row.syncStatus; }
  get isDeleted() { return this.row.isDeleted; }
  get createdAt() { return this.row.createdAt; }
  get updatedAt() { return this.row.updatedAt; }

  /** Returns a new entity with title/content merged from payload (only set when provided). */
  withUpdate(payload: UpdateFileInput): FileEntity {
    const next = { ...this.row };
    if (payload.title !== undefined) next.title = payload.title;
    if (payload.content !== undefined) next.content = payload.content;
    return new FileEntity(next);
  }

  bumpLocalVersion(): FileEntity {
    return new FileEntity({
      ...this.row,
      localVersion: this.row.localVersion + 1,
      syncStatus: 'pending',
    });
  }

  toRow(): FileRow {
    return { ...this.row };
  }

  /** API response shape (no _id). Used by handlers so mapping stays in domain. */
  toResponse(): {
    id: string;
    ddocId: string;
    title: string;
    content: string;
    portalAddress: string;
    localVersion: number;
    onchainVersion: number;
    syncStatus: string;
    isDeleted: number;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.row._id,
      ddocId: this.row.ddocId,
      title: this.row.title,
      content: this.row.content,
      portalAddress: this.row.portalAddress,
      localVersion: this.row.localVersion,
      onchainVersion: this.row.onchainVersion,
      syncStatus: this.row.syncStatus,
      isDeleted: this.row.isDeleted,
      createdAt: this.row.createdAt,
      updatedAt: this.row.updatedAt,
    };
  }
}