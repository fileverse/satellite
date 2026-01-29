import { FileEntity } from "../../../domain/file/FileEntity";
import { ExecuteResult, SqliteExecutor } from "../executor/SqliteExecutor";
import { GetFileParams, ListFilesParams, ListFilesResult } from "../../../domain/file/index";
import { FileRow } from "./FileRow";

export class FilesRepository {
  constructor(private readonly db: SqliteExecutor) { }

  private createEntityFromRow(row: FileRow): FileEntity {
    return new FileEntity(
      row._id,
      row.ddocId,
      row.title,
      row.content,
      row.portalAddress,
      row.localVersion,
      row.onchainVersion,
      row.syncStatus,
      row.isDeleted,
      row.createdAt,
      row.updatedAt,
    )
  }

  get(params: GetFileParams): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE ddocId = ? AND portalAddress = ? AND isDeleted = 0;
    `;

    const row: FileRow | null = this.db.selectOne<FileRow>(sql, [
      params.ddocId,
      params.portalAddress,
    ]);
    if (row === null) {
      return null;
    }

    const file: FileEntity = this.createEntityFromRow(row);
    return file;
  }

  // TODO: handle this awfulness
  /** Get file by internal id, including soft-deleted. */
  getByIdIncludingDeleted(fileId: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE _id = ?;
    `;
    const row: FileRow | null = this.db.selectOne<FileRow>(sql, [fileId]);
    if (row === null) {
      return null;
    }
    return this.createEntityFromRow(row);
  }

  // TODO: remove this awfulness
  /** Update onchainVersion and/or syncStatus only (used after publish). */
  updateSyncState(
    fileId: string,
    portalAddress: string,
    payload: { onchainVersion?: number; syncStatus?: string },
  ): void {
    const updates: string[] = ['updatedAt = ?'];
    const values: unknown[] = [new Date().toISOString()];
    if (payload.onchainVersion !== undefined) {
      updates.push('onchainVersion = ?');
      values.push(payload.onchainVersion);
    }
    if (payload.syncStatus !== undefined) {
      updates.push('syncStatus = ?');
      values.push(payload.syncStatus);
    }
    values.push(fileId, portalAddress);
    const sql = `
      UPDATE files
      SET ${updates.join(', ')}
      WHERE _id = ? AND portalAddress = ?
    `;
    const result: ExecuteResult = this.db.execute(sql, values);
    if (result.changes === 0) {
      throw new Error('No rows affected when updating sync state');
    }
  }

  create(file: FileEntity): void {
    const sql = `
      INSERT INTO files
      (_id, ddocId, title, content, portalAddress, localVersion, onchainVersion, syncStatus, isDeleted, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const result: ExecuteResult = this.db.execute(sql, [
      file.id,
      file.ddocId,
      file.title,
      file.content,
      file.portalAddress,
      file.localVersion,
      file.onchainVersion,
      file.syncStatus,
      file.isDeleted,
      file.createdAt,
      file.updatedAt,
    ]);
    if (result.changes === 0) {
      throw new Error(`Something went wrong. No rows were affected.`)
    }
  }

  list(params: ListFilesParams): ListFilesResult {
    const countSql = `
      SELECT COUNT(*) as count
      FROM files
      WHERE isDeleted = 0 AND portalAddress = ?
    `;
    const result = this.db.selectOne<{ count: number }>(countSql, [params.portalAddress]);
    const totalCount = result?.count || 0;

    const orderBy = 'createdAt';
    const orderDirection = 'DESC';
    const sql = `
      SELECT *
      FROM files
      WHERE isDeleted = 0 AND portalAddress = ?
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ?
      OFFSET ? 
    `;

    const rows: FileRow[] = this.db.selectAll<FileRow>(sql, [
      params.portalAddress,
      params.limit,
      params.skip,
    ]);
    const files: FileEntity[] = rows.map(row => this.createEntityFromRow(row));

    const response: ListFilesResult = {
      files: files,
      total: totalCount,
      hasNext: (params.skip + params.limit) < totalCount,
    };
    return response;
  }

  update(f: FileEntity): void {
    const sql = `
      UPDATE files
      SET title = ?, content = ?, localVersion = ?, syncStatus = ?, updatedAt = ?
      WHERE _id = ? AND portalAddress = ?
    `;

    const result: ExecuteResult = this.db.execute(sql, [
      f.title,
      f.content,
      f.localVersion,
      f.syncStatus,
      new Date().toISOString(),
      f.id,
      f.portalAddress,
    ]);
    if (result.changes === 0) {
      throw new Error(`Something went wrong. No rows were affected.`)
    }
  }

  // TODO: maybe change return type of this one and update function
  delete(file: FileEntity): void {
    const now: string = new Date().toISOString();
    const sql: string = `
      UPDATE files
      SET isDeleted = 1, syncStatus = 'pending', updatedAt = ?
      WHERE ddocId = ? AND portalAddress = ?
    `;

    const result: ExecuteResult = this.db.execute(sql, [
      now,
      file.ddocId,
      file.portalAddress,
    ]);
    if (result.changes === 0) {
      // TODO: handle this better
      throw new Error("could not delete");
    }
  }
}
