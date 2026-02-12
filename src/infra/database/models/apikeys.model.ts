import { QueryBuilder } from "../index.js";
import { uuidv7 } from "uuidv7";
import type { ApiKey } from "../../../types";

export type { ApiKey };

export class ApiKeysModel {
  private static readonly TABLE = "api_keys";

  static async create(input: {
    apiKeySeed: string;
    name: string;
    collaboratorAddress: string;
    portalAddress: string;
  }): Promise<ApiKey> {
    const _id = uuidv7();
    const now = new Date().toISOString();
    const sql = `INSERT INTO ${this.TABLE} (_id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)`;

    const result = await QueryBuilder.execute(sql, [
      _id,
      input.apiKeySeed,
      input.name,
      input.collaboratorAddress,
      input.portalAddress,
      now,
    ]);

    if (result.changes === 0) {
      throw new Error("Failed to create API key");
    }

    const created = await this.findById(_id);
    if (!created) {
      throw new Error("Failed to create API key");
    }
    return created;
  }

  static async findById(_id: string): Promise<ApiKey | undefined> {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE _id = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<ApiKey>(sql, [_id]);
  }

  static async findByCollaboratorAddress(collaboratorAddress: string): Promise<ApiKey | undefined> {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE collaboratorAddress = ? AND isDeleted = 0 LIMIT 1`;
    return QueryBuilder.selectOne<ApiKey>(sql, [collaboratorAddress]);
  }

  static async delete(_id: string): Promise<void> {
    const sql = `UPDATE ${this.TABLE} SET isDeleted = 1 WHERE _id = ?`;
    await QueryBuilder.execute(sql, [_id]);
  }

  static async findByPortalAddress(portalAddress: string): Promise<ApiKey | undefined> {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE portalAddress = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<ApiKey>(sql, [portalAddress]);
  }

  static async findByApiKey(apiKey: string): Promise<ApiKey | undefined> {
    const sql = `SELECT _id, apiKeySeed, name, collaboratorAddress, portalAddress, createdAt, isDeleted FROM ${this.TABLE} WHERE apiKeySeed = ? AND isDeleted = 0`;
    return QueryBuilder.selectOne<ApiKey>(sql, [apiKey]);
  }
}
