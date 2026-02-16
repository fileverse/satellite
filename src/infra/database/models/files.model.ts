import { QueryBuilder } from "../index.js";
import { uuidv7 } from "uuidv7";
import type { FileEntity, FileListResponse, UpdateFilePayload } from "../../../types";

export type { FileEntity, FileListResponse };

export class FilesModel {
  private static readonly TABLE = "files";

  private static parseFile(fileRaw: any): FileEntity {
    let metadata: Record<string, unknown> = {};
    try {
      if (fileRaw.metadata) {
        metadata = typeof fileRaw.metadata === "string" ? JSON.parse(fileRaw.metadata) : fileRaw.metadata;
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
      linkKey: fileRaw.linkKey,
      linkKeyNonce: fileRaw.linkKeyNonce,
      commentKey: fileRaw.commentKey,
      link: fileRaw.link,
      derivedKey: fileRaw.derivedKey,
      secretKey: fileRaw.secretKey,
    };
  }

  static async findAll(
    portalAddress: string,
    limit?: number,
    skip?: number,
  ): Promise<{ files: FileEntity[]; total: number; hasNext: boolean }> {
    const whereClause = "isDeleted = 0 AND portalAddress = ?";
    const params: any[] = [portalAddress];

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.TABLE}
      WHERE ${whereClause}
    `;
    const totalResult = await QueryBuilder.selectOne<{ count: number }>(countSql, params);
    const total = totalResult?.count || 0;
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE ${whereClause}
    `;
    const completeSql = QueryBuilder.paginate(sql, {
      limit,
      offset: skip,
      orderBy: "createdAt",
      orderDirection: "DESC",
    });

    const filesRaw = await QueryBuilder.select<any>(completeSql, params);
    const files = filesRaw.map(this.parseFile);
    const hasNext = skip !== undefined && limit !== undefined ? skip + limit < total : false;
    return { files, total, hasNext };
  }

  static async findById(_id: string, portalAddress: string): Promise<FileEntity | undefined> {
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE _id = ? AND isDeleted = 0 AND portalAddress = ?
    `;
    const result = await QueryBuilder.selectOne<any>(sql, [_id, portalAddress]);
    return result ? this.parseFile(result) : undefined;
  }

  static async findByIdIncludingDeleted(_id: string): Promise<FileEntity | undefined> {
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE _id = ?
    `;
    const result = await QueryBuilder.selectOne<any>(sql, [_id]);
    return result ? this.parseFile(result) : undefined;
  }

  static async findByIdExcludingDeleted(_id: string): Promise<FileEntity | undefined> {
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE _id = ? AND isDeleted = 0
    `;
    const result = await QueryBuilder.selectOne<any>(sql, [_id]);
    return result ? this.parseFile(result) : undefined;
  }

  static async findByDDocId(ddocId: string, portalAddress: string): Promise<FileEntity | undefined> {
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE ddocId = ? AND isDeleted = 0 AND portalAddress = ?
    `;
    const result = await QueryBuilder.selectOne<any>(sql, [ddocId, portalAddress]);
    return result ? this.parseFile(result) : undefined;
  }

  static async searchByTitle(
    searchTerm: string,
    portalAddress: string,
    limit?: number,
    skip?: number,
  ): Promise<FileEntity[]> {
    const sql = `
      SELECT *
      FROM ${this.TABLE}
      WHERE LOWER(title) LIKE LOWER(?) AND isDeleted = 0 AND portalAddress = ?
    `;
    const completeSql = QueryBuilder.paginate(sql, {
      limit,
      offset: skip,
      orderBy: "createdAt",
      orderDirection: "DESC",
    });
    const filesRaw = await QueryBuilder.select<any>(completeSql, [`%${searchTerm}%`, portalAddress]);
    return filesRaw.map(this.parseFile);
  }

  static async create(input: {
    title: string;
    content: string;
    ddocId: string;
    portalAddress: string;
    linkKey: string;
    linkKeyNonce: string;
    derivedKey: string;
    secretKey: string;
    commentKey: string;
  }): Promise<FileEntity> {
    const _id = uuidv7();
    const sql = `
      INSERT INTO ${this.TABLE}
      (_id, title, content, ddocId, portalAddress, linkKey, linkKeyNonce, derivedKey, secretKey, commentKey)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await QueryBuilder.execute(sql, [
      _id,
      input.title,
      input.content,
      input.ddocId,
      input.portalAddress,
      input.linkKey,
      input.linkKeyNonce,
      input.derivedKey,
      input.secretKey,
      input.commentKey,
    ]);
    // NOTE: default values while file creation: localVersion = 1, onchainVersion = 0, syncStatus = 'pending'

    const created = await this.findById(_id, input.portalAddress);
    if (!created) {
      throw new Error("Failed to create file");
    }
    return created;
  }

  static async update(_id: string, payload: UpdateFilePayload, portalAddress: string): Promise<FileEntity> {
    const now = new Date().toISOString();

    const keys: string[] = [];
    const values: any[] = [];
    for (const [k, v] of Object.entries(payload)) {
      if (v !== undefined) {
        // Handle metadata specially - convert to JSON string
        if (k === "metadata" && typeof v === "object") {
          keys.push(`${k} = ?`);
          values.push(JSON.stringify(v));
        } else {
          keys.push(`${k} = ?`);
          values.push(v);
        }
      }
    }

    // Always add updatedAt
    keys.push("updatedAt = ?");
    values.push(now, _id, portalAddress);

    const updateChain = keys.join(", ");
    const sql = `UPDATE ${this.TABLE} SET ${updateChain} WHERE _id = ? AND portalAddress = ?`;

    await QueryBuilder.execute(sql, values);

    const updated = await this.findById(_id, portalAddress);
    if (!updated) {
      throw new Error("Failed to update file");
    }
    return updated;
  }

  static async softDelete(_id: string): Promise<FileEntity> {
    const now = new Date().toISOString();
    const sql = `
      UPDATE ${this.TABLE}
      SET isDeleted = 1, syncStatus = 'pending', updatedAt = ?
      WHERE _id = ?
    `;

    await QueryBuilder.execute(sql, [now, _id]);

    // Use findByIdIncludingDeleted since the file is now marked as deleted
    const deleted = await this.findByIdIncludingDeleted(_id);
    if (!deleted) {
      throw new Error("Failed to delete file");
    }
    return deleted;
  }
}
