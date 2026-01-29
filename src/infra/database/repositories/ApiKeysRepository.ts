import { ApiKeyEntity } from '../../../domain/portal/ApiKeyEntity';
import { ExecuteResult, SqliteExecutor } from '../executor/SqliteExecutor';
import { ApiKeyRow } from './ApiKeyRow';

const TABLE = 'api_keys';

export class ApiKeysRepository {
  constructor(private readonly db: SqliteExecutor) {}

  private createEntityFromRow(row: ApiKeyRow): ApiKeyEntity {
    return new ApiKeyEntity(
      row._id,
      row.apiKeySeed,
      row.name,
      row.collaboratorAddress,
      row.portalAddress,
      row.createdAt,
      row.isDeleted,
    );
  }

  findById(id: string): ApiKeyEntity | null {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${TABLE} WHERE _id = ? AND isDeleted = 0`;
    const row = this.db.selectOne<ApiKeyRow>(sql, [id]);
    if (row === null) return null;
    return this.createEntityFromRow(row);
  }

  create(apiKey: ApiKeyEntity): void {
    const sql = `INSERT INTO ${TABLE} (_id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt) VALUES (?, ?, ?, ?, ?, ?)`;
    const result: ExecuteResult = this.db.execute(sql, [
      apiKey.id,
      apiKey.apiKeySeed,
      apiKey.name,
      apiKey.collaboratorAddress,
      apiKey.portalAddress,
      apiKey.createdAt,
    ]);
    if (result.changes === 0) throw new Error('Failed to create API key');
  }

  softDelete(id: string): void {
    const sql = `UPDATE ${TABLE} SET isDeleted = 1 WHERE _id = ?`;
    const result: ExecuteResult = this.db.execute(sql, [id]);
    if (result.changes === 0) throw new Error('Failed to delete API key');
  }
}
