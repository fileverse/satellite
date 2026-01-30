import { uuidv7 } from "uuidv7";
import { FileRow } from "../../infra/database/repositories/FileRow";
import type { CreateFileInput, UpdateFileInput } from "./types";
import { generate } from "short-uuid";

export class FileEntity {

  constructor(
    private readonly _id: string,
    private readonly _ddocId: string,
    private readonly _title: string,
    private readonly _content: string,
    private readonly _portalAddress: string,
    private readonly _localVersion: number,
    private readonly _onchainVersion: number,
    private readonly _syncStatus: string,
    private readonly _isDeleted: number,
    private readonly _createdAt: string,
    private readonly _updatedAt: string,
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

  withUpdate(payload: UpdateFileInput): FileEntity {
    return new FileEntity(
      this._id,
      this._ddocId,
      payload.title ?? this._title,
      payload.content ?? this._content,
      this._portalAddress,
      this._localVersion + 1,
      this._onchainVersion,
      'pending',
      this._isDeleted,
      this._createdAt,
      new Date().toISOString(),
    );
  }
}