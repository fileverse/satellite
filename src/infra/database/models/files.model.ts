import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';
import { UpdateFilePayload } from './files/types';

export interface File {
  _id: string;
  title: string;
  content: string;
  localVersion: number;
  onchainVersion: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  isDeleted: number;
  createdAt: string;
  updatedAt: string;
}

export interface FileListResponse {
  ddocs: File[];
  total: number;
  hasNext: boolean;
}

export class FilesModel {
  private static readonly TABLE = 'files';

  static findAll(limit?: number, skip?: number): { files: File[]; total: number; hasNext: boolean } {
    // Get total count (excluding deleted files)
    const countSql = `SELECT COUNT(*) as count FROM ${this.TABLE} WHERE isDeleted = 0`;
    const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql);
    const total = totalResult?.count || 0;

    // Get paginated results
    const sql = QueryBuilder.paginate(
      `SELECT _id, ddocId, title, content, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt
      FROM ${this.TABLE}
      WHERE isDeleted = 0`,
      {
        limit,
        offset: skip,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }
    );

    const files = QueryBuilder.select<File>(sql);
    const hasNext = skip !== undefined && limit !== undefined ? (skip + limit) < total : false;

    return { files, total, hasNext };
  }

  static findById(_id: string): File | undefined {
    const sql = `SELECT _id, ddocId, title, content, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt
    FROM ${this.TABLE} WHERE _id = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<File>(sql, [_id]);
  }

  static findByIdIncludingDeleted(_id: string): File | undefined {
    const sql = `SELECT _id, ddocId, title, content, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt
    FROM ${this.TABLE} WHERE _id = ?`;
    return QueryBuilder.selectOne<File>(sql, [_id]);
  }

  static findByDDocId(ddocId: string): File | undefined {
    const sql = `SELECT _id, ddocId, title, content, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt
    FROM ${this.TABLE} WHERE ddocId = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<File>(sql, [ddocId]);
  }

  static findByFolderRef(folderRef: string, limit?: number, skip?: number): File[] {
    // FolderRef functionality removed in simplified schema
    // Return empty array for now
    return [];
  }

  static searchByTitle(searchTerm: string, limit?: number, skip?: number): File[] {
    const sql = QueryBuilder.paginate(
      `SELECT _id, title, content, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt
      FROM ${this.TABLE} 
      WHERE LOWER(title) LIKE LOWER(?) AND isDeleted = 0`,
      {
        limit,
        offset: skip,
        orderBy: 'createdAt',
        orderDirection: 'DESC'
      }
    );

    return QueryBuilder.select<File>(sql, [`%${searchTerm}%`]);
  }

  static create(input: {
    title: string;
    content: string;
    ddocId: string;
  }): File {
    const _id = uuidv7();
    const sql = `INSERT INTO ${this.TABLE} (_id, title, content, ddocId) VALUES (?, ?, ?, ?)`;

    QueryBuilder.execute(sql, [
      _id,
      input.title,
      input.content,
      input.ddocId,
    ]);
    // NOTE: default values while file creation: localVersion = 1, onchainVersion = 0, syncStatus = 'pending'

    const created = this.findById(_id);
    if (!created) {
      throw new Error('Failed to create file');
    }
    return created;
  }

  static update(
    _id: string,
    payload: UpdateFilePayload,
  ): File {
    const now = new Date().toISOString();

    const keys: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        keys.push(`${k} = ?`);
        values.push(v);
      }
    }

    // Always add updatedAt
    keys.push('updatedAt = ?');
    values.push(now);

    const updateChain = keys.join(', ');
    const sql = `UPDATE ${this.TABLE} SET ${updateChain} WHERE _id = ?`;
    values.push(_id);
    QueryBuilder.execute(sql, values);

    const updated = this.findById(_id);
    if (!updated) {
      throw new Error('Failed to update file');
    }
    return updated;
  }

  static softDelete(_id: string): File {
    const now = new Date().toISOString();
    const sql = `UPDATE ${this.TABLE} 
      SET isDeleted = 1, syncStatus = 'pending', updatedAt = ?
      WHERE _id = ?`;

    QueryBuilder.execute(sql, [now, _id]);

    // Use findByIdIncludingDeleted since the file is now marked as deleted
    const deleted = this.findByIdIncludingDeleted(_id);
    if (!deleted) {
      throw new Error('Failed to delete file');
    }
    return deleted;
  }
}
