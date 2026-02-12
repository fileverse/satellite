import { QueryBuilder } from "../index.js";
import { uuidv7 } from "uuidv7";
import type { Portal } from "../../../types";

export type { Portal };

export class PortalsModel {
  private static readonly TABLE = "portals";

  static async findByPortalAddress(portalAddress: string): Promise<Portal | undefined> {
    const sql = `SELECT _id, portalAddress, portalSeed, ownerAddress, createdAt, updatedAt FROM ${this.TABLE} WHERE portalAddress = ?`;
    return QueryBuilder.selectOne<Portal>(sql, [portalAddress]);
  }

  static async create(input: { portalAddress: string; portalSeed: string; ownerAddress: string }): Promise<Portal> {
    const _id = uuidv7();
    const now = new Date().toISOString();
    const sql = `INSERT INTO ${this.TABLE} (_id, portalAddress, portalSeed, ownerAddress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`;

    await QueryBuilder.execute(sql, [_id, input.portalAddress, input.portalSeed, input.ownerAddress, now, now]);

    const created = await this.findByPortalAddress(input.portalAddress);
    if (!created) {
      throw new Error("Failed to create portal");
    }
    return created;
  }

  static async update(
    portalAddress: string,
    input: {
      portalSeed?: string;
      ownerAddress?: string;
    },
  ): Promise<Portal> {
    const now = new Date().toISOString();
    const keys: string[] = [];
    const values: any[] = [];

    for (const [k, v] of Object.entries(input)) {
      if (v !== undefined) {
        keys.push(`${k} = ?`);
        values.push(v);
      }
    }

    keys.push("updatedAt = ?");
    values.push(now);

    const updateChain = keys.join(", ");
    const sql = `UPDATE ${this.TABLE} SET ${updateChain} WHERE portalAddress = ?`;
    values.push(portalAddress);
    await QueryBuilder.execute(sql, values);

    const updated = await this.findByPortalAddress(portalAddress);
    if (!updated) {
      throw new Error("Failed to update portal");
    }
    return updated;
  }

  static async upsert(input: { portalAddress: string; portalSeed: string; ownerAddress: string }): Promise<Portal> {
    const existing = await this.findByPortalAddress(input.portalAddress);
    if (existing) {
      return this.update(input.portalAddress, {
        portalSeed: input.portalSeed,
        ownerAddress: input.ownerAddress,
      });
    }
    return this.create(input);
  }
}
