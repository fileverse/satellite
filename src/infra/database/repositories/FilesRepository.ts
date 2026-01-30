import { FileEntity } from "../../../domain/file/FileEntity";
import { ExecuteResult, SqliteExecutor } from "../executor/SqliteExecutor";
import { FileRow } from "./FileRow";

export class FilesRepository {
  constructor(private readonly db: SqliteExecutor) {}

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

  findByDDocId(ddocId: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE ddocId = ? AND portalAddress = ? AND isDeleted = 0
    `;

    const row: FileRow | null = this.db.selectOne<FileRow>(sql, [ddocId, portalAddress]);
    if (row === null) {
      return row;
    }
    return this.createEntityFromRow(row);
  }

  findById(_id: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE _id = ? AND portalAddress = ? AND isDeleted = 0
    `;

    const row = this.db.selectOne<FileRow>(sql, [_id, portalAddress]);
    if (row === null) {
      return null;
    }
    return this.createEntityFromRow(row);
  }

  findAll(): FileEntity[] {
    return [];
  }

  findPaginated(_limit: number, _offset: number): FileEntity[] {
    return [];
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

  delete(_id: string): FileEntity {
    throw new Error("Not implemented");
  }
}