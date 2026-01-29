import { PortalEntity } from '../../../domain/portal/PortalEntity';
import { ExecuteResult, SqliteExecutor } from '../executor/SqliteExecutor';
import { PortalRow } from './PortalRow';

const TABLE = 'portals';

export class PortalsRepository {
  constructor(private readonly db: SqliteExecutor) {}

  private createEntityFromRow(row: PortalRow): PortalEntity {
    return new PortalEntity(
      row._id,
      row.portalAddress,
      row.portalSeed,
      row.ownerAddress,
      row.createdAt,
      row.updatedAt,
    );
  }

  getByPortalAddress(portalAddress: string): PortalEntity | null {
    const sql = `SELECT _id, portalAddress, portalSeed, ownerAddress, createdAt, updatedAt FROM ${TABLE} WHERE portalAddress = ?`;
    const row = this.db.selectOne<PortalRow>(sql, [portalAddress]);
    if (row === null) return null;
    return this.createEntityFromRow(row);
  }

  create(portal: PortalEntity): PortalEntity {
    const sql = `INSERT INTO ${TABLE} (_id, portalAddress, portalSeed, ownerAddress, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`;
    const result: ExecuteResult = this.db.execute(sql, [
      portal.id,
      portal.portalAddress,
      portal.portalSeed,
      portal.ownerAddress,
      portal.createdAt,
      portal.updatedAt,
    ]);
    if (result.changes === 0) throw new Error('Failed to create portal');
    return portal;
  }

  update(portal: PortalEntity): void {
    const now = new Date().toISOString();
    const sql = `UPDATE ${TABLE} SET portalSeed = ?, ownerAddress = ?, updatedAt = ? WHERE portalAddress = ?`;
    const result: ExecuteResult = this.db.execute(sql, [
      portal.portalSeed,
      portal.ownerAddress,
      now,
      portal.portalAddress,
    ]);
    if (result.changes === 0) throw new Error('Failed to update portal');
  }
}
