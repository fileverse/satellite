import { uuidv7 } from "uuidv7";
import { FileRow } from "../../infra/database/repositories/FileRow";
import type { CreateFileInput, UpdateFileInput } from "./types";
import { generate } from "short-uuid";

export class FileEntity {
  private readonly _id: string;
  private readonly _ddocId: string;
  private readonly _title: string;
  private readonly _content: string;
  private readonly _portalAddress: string;
  private readonly _localVersion: number;
  private readonly _onchainVersion: number;
  private readonly _syncStatus: string;
  private readonly _isDeleted: number;
  private readonly _createdAt: string;
  private readonly _updatedAt: string;
  
  constructor(private readonly input: CreateFileInput) {
    const now = new Date().toISOString();
    this._id = uuidv7();
    this._ddocId = generate();
    this._title = input.title;
    this._content = input.content;
    this._portalAddress = input.portalAddress;
    this._localVersion = 1;
    this._onchainVersion = 0;
    this._syncStatus = 'pending';
    this._isDeleted = 0;
    this._createdAt = now;
    this._updatedAt = now;
  }

  get id() { return this._id; }
  get ddocId() { return this._ddocId; }
  get title() { return this._title; }
  get content() { return this._content; }
  get portalAddress() { return this._portalAddress; }
  get localVersion() { return this._localVersion; }
  get onchainVersion() { return this._onchainVersion; }
  get syncStatus() { return this._syncStatus; }
  get isDeleted() { return this._isDeleted; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  /** Returns a new entity with title/content merged from payload (only set when provided). */
  withUpdate(payload: UpdateFileInput): FileEntity {
    const entity = { ...this };
    if (payload.title) {
      entity.title = payload.title;
    }
    if (payload.content) {
      entity.content = payload.content;
    }
    return new FileEntity(entity);
  }

  // bumpLocalVersion(): FileEntity {
  //   return new FileEntity({
  //     ...this.row,
  //     localVersion: this.row.localVersion + 1,
  //     syncStatus: 'pending',
  //   });
  // }

  // toRow(): FileRow {
  //   return { ...this.row };
  // }

  /** API response shape (no _id). Used by handlers so mapping stays in domain. */
  // toResponse(): {
  //   id: string;
  //   ddocId: string;
  //   title: string;
  //   content: string;
  //   portalAddress: string;
  //   localVersion: number;
  //   onchainVersion: number;
  //   syncStatus: string;
  //   isDeleted: number;
  //   createdAt: string;
  //   updatedAt: string;
  // } {
  //   return {
  //     id: this.row._id,
  //     ddocId: this.row.ddocId,
  //     title: this.row.title,
  //     content: this.row.content,
  //     portalAddress: this.row.portalAddress,
  //     localVersion: this.row.localVersion,
  //     onchainVersion: this.row.onchainVersion,
  //     syncStatus: this.row.syncStatus,
  //     isDeleted: this.row.isDeleted,
  //     createdAt: this.row.createdAt,
  //     updatedAt: this.row.updatedAt,
  //   };
  // }
}