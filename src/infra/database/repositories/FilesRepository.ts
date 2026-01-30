import { FileEntity } from "../../../domain/file/FileEntity";
import { SqliteExecutor } from "../executor/SqliteExecutor";
import { FileRow } from "./FileRow";

export class FilesRepository {
  constructor(private readonly db: SqliteExecutor) {}

  private toEntity(row: FileRow | null): FileEntity | null {
    return row ? new FileEntity(row) : null;
  }

  findByDDocId(ddocId: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE ddocId = ? AND portalAddress = ? AND isDeleted = 0
    `;
    const row = this.db.selectOne<FileRow>(sql, [ddocId, portalAddress]);
    return this.toEntity(row);
  }

  findById(_id: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE _id = ? AND portalAddress = ? AND isDeleted = 0
    `;
    const row = this.db.selectOne<FileRow>(sql, [_id, portalAddress]);
    return this.toEntity(row);
  }

  findAll(): FileEntity[] {
    return [];
  }

  findPaginated(_limit: number, _offset: number): FileEntity[] {
    return [];
  }

  insert(_row: FileRow): FileEntity {
    throw new Error("Not implemented");
  }

  update(file: FileEntity): void {
    const row = file.toRow();
    const sql = `
      UPDATE files
      SET title = ?, content = ?, localVersion = ?, syncStatus = ?, updatedAt = ?
      WHERE _id = ? AND portalAddress = ?
    `;

    const result = this.db.execute(sql, [
      row.title,
      row.content,
      row.localVersion,
      row.syncStatus,
      new Date().toISOString(),
      row._id,
      row.portalAddress,
    ]);

    if (result.changes === 0) {
      throw new Error(`Something went wrong. No rows were affected.`)
    }
  }

  delete(_id: string): FileEntity {
    throw new Error("Not implemented");
  }
}