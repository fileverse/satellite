import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';

export interface ApiKey {
  _id: string;
  apiKeySeed: string;
  name: string;
  collaboratorAddress: string;
  portalAddress: string;
  createdAt: number;
}

export class ApiKeysModel {
  private static readonly TABLE = 'api_keys';

  static create(input: {
    apiKeySeed: string;
    name: string;
    collaboratorAddress: string;
    portalAddress: string;
    createdAt: number;
  }): ApiKey {
    const _id = uuidv7();
    const sql = `INSERT INTO ${this.TABLE} (_id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt) 
    VALUES (?, ?, ?, ?, ?, ?)`;

    QueryBuilder.execute(sql, [
      _id,
      input.apiKeySeed,
      input.name,
      input.collaboratorAddress,
      input.portalAddress,
      input.createdAt
    ]);

    const created = this.findByApiKeySeed(input.apiKeySeed);
    if (!created) {
      throw new Error('Failed to create API key');
    }
    return created;
  }

  static findByApiKeySeed(apiKeySeed: string): ApiKey | undefined {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt FROM ${this.TABLE} WHERE apiKeySeed = ?`;
    return QueryBuilder.selectOne<ApiKey>(sql, [apiKeySeed]);
  }
}