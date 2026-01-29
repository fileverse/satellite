import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';
import { UpdateFilePayload } from './files/types';

export interface File {
  _id: string;
  title: string;
  content: string;
  ddocId: string;
  localVersion: number;
  onchainVersion: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  isDeleted: number;
  onChainFileId: number | null;
  portalAddress: string;
  metadata: Record<string, unknown>;
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

  private static parseFile(fileRaw: any): File {
    let metadata: Record<string, unknown> = {};
    try {
      if (fileRaw.metadata) {
        metadata = typeof fileRaw.metadata === 'string' 
          ? JSON.parse(fileRaw.metadata) 
          : fileRaw.metadata;
      }
    } catch (e) {
      // If parsing fails, use empty object
      metadata = {};
    }

    return {
      _id: fileRaw._id,
      ddocId: fileRaw.ddocId,
      title: fileRaw.title,
      content: fileRaw.content,
      localVersion: fileRaw.localVersion,
      onchainVersion: fileRaw.onchainVersion,
      syncStatus: fileRaw.syncStatus,
      isDeleted: fileRaw.isDeleted,
      onChainFileId: fileRaw.onChainFileId ?? null,
      portalAddress: fileRaw.portalAddress,
      metadata: metadata || {},
      createdAt: fileRaw.createdAt,
      updatedAt: fileRaw.updatedAt,
    };
  }

  static findAll(portalAddress: string, limit?: number, skip?: number): { files: File[]; total: number; hasNext: boolean } {
    const whereClause = 'isDeleted = 0 AND portalAddress = ?';
    const params: any[] = [portalAddress];

    const countSql = `
      SELECT COUNT(*) as count 
      FROM ${this.TABLE} 
      WHERE ${whereClause}
    `;
    const totalResult = QueryBuilder.selectOne<{ count: number }>(countSql, params);
    const total = totalResult?.count || 0;
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE ${whereClause}
    `;
    const completeSql = QueryBuilder.paginate(sql, {
      limit,
      offset: skip,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });

    const filesRaw = QueryBuilder.select<any>(completeSql, params);
    const files = filesRaw.map(this.parseFile);
    const hasNext = skip !== undefined && limit !== undefined ? (skip + limit) < total : false;
    return { files, total, hasNext };
  }

  static findById(_id: string, portalAddress: string): File | undefined {
    const sql = `
      SELECT *
      FROM ${this.TABLE} 
      WHERE _id = ? AND isDeleted = 0 AND portalAddress = ?
    `;
    const result = QueryBuilder.selectOne<any>(sql, [_id, portalAddress]);
    return result ? this.parseFile(result) : undefined;
  }

  static findByIdIncludingDeleted(_id: string): File | undefined {
    const sql = `
      SELECT *
      FROM ${this.TABLE} 
      WHERE _id = ?
    `;
    const result = QueryBuilder.selectOne<any>(sql, [_id]);
    return result ? this.parseFile(result) : undefined;
  }

  static findByDDocId(ddocId: string, portalAddress: string): File | undefined {
    const sql = `
      SELECT *
      FROM ${this.TABLE} 
      WHERE ddocId = ? AND isDeleted = 0 AND portalAddress = ?
    `;
    const result = QueryBuilder.selectOne<any>(sql, [ddocId, portalAddress]);
    return result ? this.parseFile(result) : undefined;
  }

  static searchByTitle(searchTerm: string, portalAddress: string, limit?: number, skip?: number): File[] {
    const sql = `
      SELECT *
      FROM ${this.TABLE} 
      WHERE LOWER(title) LIKE LOWER(?) AND isDeleted = 0 AND portalAddress = ?
    `;
    const completeSql = QueryBuilder.paginate(sql, {
      limit,
      offset: skip,
      orderBy: 'createdAt',
      orderDirection: 'DESC'
    });
    const filesRaw = QueryBuilder.select<any>(completeSql, [`%${searchTerm}%`, portalAddress]);
    return filesRaw.map(this.parseFile);
  }

  static create(input: {
    title: string;
    content: string;
    ddocId: string;
    portalAddress: string;
  }): File {
    const _id = uuidv7();
    const sql = `
      INSERT INTO ${this.TABLE} 
      (_id, title, content, ddocId, portalAddress) 
      VALUES (?, ?, ?, ?, ?)
    `;

    QueryBuilder.execute(sql, [
      _id,
      input.title,
      input.content,
      input.ddocId,
      input.portalAddress,
    ]);
    // NOTE: default values while file creation: localVersion = 1, onchainVersion = 0, syncStatus = 'pending'

    const created = this.findById(_id, input.portalAddress);
    if (!created) {
      throw new Error('Failed to create file');
    }
    return created;
  }

  static update(
    _id: string,
    payload: UpdateFilePayload,
    portalAddress: string,
  ): File {
    const now = new Date().toISOString();

    const keys: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        // Handle metadata specially - convert to JSON string
        if (k === 'metadata' && typeof v === 'object') {
          keys.push(`${k} = ?`);
          values.push(JSON.stringify(v));
        } else {
          keys.push(`${k} = ?`);
          values.push(v);
        }
      }
    }

    // Always add updatedAt
    keys.push('updatedAt = ?');
    values.push(now, _id, portalAddress);

    const updateChain = keys.join(', ');
    const sql = `UPDATE ${this.TABLE} SET ${updateChain} WHERE _id = ? AND portalAddress = ?`;
    QueryBuilder.execute(sql, values);

    const updated = this.findById(_id, portalAddress);
    if (!updated) {
      throw new Error('Failed to update file');
    }
    return updated;
  }

  static softDelete(_id: string): File {
    const now = new Date().toISOString();
    const sql = `
      UPDATE ${this.TABLE} 
      SET isDeleted = 1, syncStatus = 'pending', updatedAt = ?
      WHERE _id = ?
    `;

    QueryBuilder.execute(sql, [now, _id]);

    // Use findByIdIncludingDeleted since the file is now marked as deleted
    const deleted = this.findByIdIncludingDeleted(_id);
    if (!deleted) {
      throw new Error('Failed to delete file');
    }
    return deleted;
  }
}
