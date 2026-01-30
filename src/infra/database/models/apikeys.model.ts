import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';

export interface ApiKey {
  _id: string;
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
  createdAt: string;
  isDeleted: number;
}

export class ApiKeysModel {
  private static readonly TABLE = 'api_keys';

  static create(input: {
    apiKeySeed: string;
    name: string;
    collaboratorAddress: string;
    portalAddress: string;
  }): ApiKey {
    const _id = uuidv7();
    const now = new Date().toISOString();
    const sql = `INSERT INTO ${this.TABLE} (_id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?)`;

    const result = QueryBuilder.execute(sql, [
      _id,
      input.apiKeySeed,
      input.name,
      input.collaboratorAddress,
      input.portalAddress,
      now
    ]);

    if (result.changes === 0) {
      throw new Error('Failed to create API key');
    }

    const created = this.findById(_id);
    if (!created) {
      throw new Error('Failed to create API key');
    }
    return created;
  }

  static findById(_id: string): ApiKey | undefined {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE _id = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<ApiKey>(sql, [_id]);
  }

  static findByCollaboratorAddress(collaboratorAddress: string): ApiKey | undefined {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE collaboratorAddress = ? AND isDeleted = 0 LIMIT 1`;
    return QueryBuilder.selectOne<ApiKey>(sql, [collaboratorAddress]);
  }

  static delete(_id: string): void {
    const sql = `UPDATE ${this.TABLE} SET isDeleted = 1 WHERE _id = ?`;
    QueryBuilder.execute(sql, [_id]);
  }
}