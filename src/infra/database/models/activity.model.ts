import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';

export type ActivityType =
  | 'add-file'
  | 'edit-file'
  | 'delete-file'
  | 'create-key'
  | 'remove-key';

export interface Activity {
  _id: string;
  type: ActivityType;
  apiKeyName: string;
  portalAddress: string;
  fileId: string | null;
  documentTitle: string | null;
  timestamp: number;
}

interface ActivityRow {
  _id: string;
  type: string;
  apiKeyName: string;
  portalAddress: string;
  fileId: string | null;
  documentTitle: string | null;
  timestamp: number;
}

export interface ActivityListResult {
  activities: Activity[];
  total: number;
  hasNext: boolean;
}

export class ActivityModel {
  private static readonly TABLE = 'activity';

  static create(input: {
    type: ActivityType;
    apiKeyName: string;
    portalAddress: string;
    fileId?: string | null;
    documentTitle?: string | null;
  }): Activity {
    const _id = uuidv7();
    const timestamp = Date.now();
    const fileId = input.fileId ?? null;
    const documentTitle = input.documentTitle ?? null;

    const sql = `
      INSERT INTO ${this.TABLE}
      (_id, type, apiKeyName, portalAddress, fileId, documentTitle, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    QueryBuilder.execute(sql, [
      _id,
      input.type,
      input.apiKeyName,
      input.portalAddress,
      fileId,
      documentTitle,
      timestamp,
    ]);

    return {
      _id,
      type: input.type,
      apiKeyName: input.apiKeyName,
      portalAddress: input.portalAddress,
      fileId,
      documentTitle,
      timestamp,
    };
  }

  static findByPortal(
    portalAddress: string,
    limit?: number,
    skip?: number
  ): ActivityListResult {
    const whereClause = 'portalAddress = ?';
    const params: (string | number)[] = [portalAddress];

    const countSql = `
      SELECT COUNT(*) as count
      FROM ${this.TABLE}
      WHERE ${whereClause}
    `;
    const totalResult = QueryBuilder.selectOne<{ count: number }>(
      countSql,
      params
    );
    const total = totalResult?.count ?? 0;

    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE ${whereClause}
    `;
    const completeSql = QueryBuilder.paginate(sql, {
      limit,
      offset: skip,
      orderBy: 'timestamp',
      orderDirection: 'DESC',
    });

    const rows = QueryBuilder.select<ActivityRow>(completeSql, params);
    const activities = rows.map((row) => this.parseActivity(row));
    const hasNext =
      skip !== undefined && limit !== undefined
        ? skip + limit < total
        : false;

    return { activities, total, hasNext };
  }

  private static parseActivity(row: ActivityRow): Activity {
    return {
      _id: row._id,
      type: row.type as ActivityType,
      apiKeyName: row.apiKeyName,
      portalAddress: row.portalAddress,
      fileId: row.fileId,
      documentTitle: row.documentTitle,
      timestamp: row.timestamp,
    };
  }
}
