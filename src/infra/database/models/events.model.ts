import { QueryBuilder } from '../index';
import { uuidv7 } from 'uuidv7';

export type EventType = 'create' | 'update' | 'delete';
export type EventStatus = 'processing' | 'processed';

export interface Event {
  _id: string;
  type: EventType;
  timestamp: number;
  fileId: string;
  status: EventStatus;
}

export class EventsModel {
  private static readonly TABLE = 'events';

  static create(input: {
    type: EventType;
    fileId: string;
  }): Event {
    const _id = uuidv7();
    const timestamp = Date.now();
    const status: EventStatus = 'processing';

    const sql = `
      INSERT INTO ${this.TABLE} 
      (_id, type, timestamp, fileId, status) 
      VALUES (?, ?, ?, ?, ?)
    `;

    QueryBuilder.execute(sql, [
      _id,
      input.type,
      timestamp,
      input.fileId,
      status,
    ]);

    return {
      _id,
      type: input.type,
      timestamp,
      fileId: input.fileId,
      status,
    };
  }

  static findNextPending(): Event | undefined {
    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE status = ?
      ORDER BY timestamp ASC
      LIMIT 1
    `;
    const row = QueryBuilder.selectOne<{
      _id: string;
      type: string;
      timestamp: number;
      fileId: string;
      status: string;
    }>(sql, ['processing']);
    return row ? this.parseEvent(row) : undefined;
  }

  static markProcessed(_id: string): void {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = ?
      WHERE _id = ?
    `;
    QueryBuilder.execute(sql, ['processed', _id]);
  }

  private static parseEvent(row: {
    _id: string;
    type: string;
    timestamp: number;
    fileId: string;
    status: string;
  }): Event {
    return {
      _id: row._id,
      type: row.type as EventType,
      timestamp: row.timestamp,
      fileId: row.fileId,
      status: row.status as EventStatus,
    };
  }
}
