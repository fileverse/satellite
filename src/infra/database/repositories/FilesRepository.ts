import { uuidv7 } from "uuidv7";
import { FileEntity } from "../../../domain/file/FileEntity";
import { ExecuteResult, SqliteExecutor } from "../executor/SqliteExecutor";
import { FileRow } from "./FileRow";

export class FilesRepository {
  constructor(private readonly db: SqliteExecutor) {}

  private transformRowToEntity(row: FileRow): FileEntity {
    return new FileEntity(row);
  }

  findByDDocId(ddocId: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE ddocId = ? AND portalAddress = ? AND isDeleted = 0
    `;
    const row = this.db.selectOne<FileRow>(sql, [ddocId, portalAddress]);
    return this.transformRowToEntity(row);
  }

  findById(_id: string, portalAddress: string): FileEntity | null {
    const sql = `
      SELECT *
      FROM files
      WHERE _id = ? AND portalAddress = ? AND isDeleted = 0
    `;
    const row = this.db.selectOne<FileRow>(sql, [_id, portalAddress]);
    if (row === null) {
      // TODO: handle this case
      return null;
    }

    return this.transformRowToEntity(row);
  }

  findAll(): FileEntity[] {
    return [];
  }

  findPaginated(_limit: number, _offset: number): FileEntity[] {
    return [];
  }

  create(f: FileEntity): FileEntity {
    const _id = uuidv7();
    const sql = `
      INSERT INTO files
      (_id, title, content, ddocId, portalAddress)
      VALUES (?, ?, ?, ?, ?)
      RETURNING *;
    `;

    const result: FileRow | null = this.db.selectOne(sql, [
      _id,
      f.title,
      f.content,
      f.ddocId,
      f.portalAddress,
    ]);

    if (result === null) {
      // Crash loudly!
      // TODO: Check if there is a better way of handling this.
      throw new Error('Invariant violation: INSERT RETURNING returned no row')
    }

    return this.transformRowToEntity(result);
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