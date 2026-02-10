import { QueryBuilder } from "../index";
import { uuidv7 } from "uuidv7";
import { notifyNewEvent } from "../../worker/workerSignal";
import type { Event, EventType, EventStatus } from "../../../types";

export type { Event, EventType, EventStatus };

const RETRY_DELAYS_MS = [5000, 30000, 120000];

interface EventRow {
  _id: string;
  type: string;
  timestamp: number;
  fileId: string;
  status: string;
  retryCount: number;
  lastError: string | null;
  lockedAt: number | null;
  nextRetryAt: number | null;
}

export class EventsModel {
  private static readonly TABLE = "events";

  static create(input: { type: EventType; fileId: string }): Event {
    const _id = uuidv7();
    const timestamp = Date.now();
    const status: EventStatus = "pending";

    const sql = `
      INSERT INTO ${this.TABLE} 
      (_id, type, timestamp, fileId, status, retryCount, lastError, lockedAt, nextRetryAt) 
      VALUES (?, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `;

    QueryBuilder.execute(sql, [_id, input.type, timestamp, input.fileId, status]);

    notifyNewEvent();

    return {
      _id,
      type: input.type,
      timestamp,
      fileId: input.fileId,
      status,
      retryCount: 0,
      lastError: null,
      lockedAt: null,
      nextRetryAt: null,
    };
  }

  static findById(_id: string): Event | undefined {
    const sql = `SELECT * FROM ${this.TABLE} WHERE _id = ?`;
    const row = QueryBuilder.selectOne<EventRow>(sql, [_id]);
    return row ? this.parseEvent(row) : undefined;
  }

  static findNextPending(): Event | undefined {
    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE status = 'pending'
      ORDER BY timestamp ASC
      LIMIT 1
    `;
    const row = QueryBuilder.selectOne<EventRow>(sql, []);
    return row ? this.parseEvent(row) : undefined;
  }

  static findNextEligible(lockedFileIds: string[]): Event | undefined {
    const now = Date.now();

    const exclusionClause =
      lockedFileIds.length > 0 ? `AND e1.fileId NOT IN (${lockedFileIds.map(() => "?").join(", ")})` : "";

    const sql = `
      SELECT e1.* FROM ${this.TABLE} e1
      WHERE e1.status = 'pending'
      AND (e1.nextRetryAt IS NULL OR e1.nextRetryAt <= ?)
      ${exclusionClause}
      AND NOT EXISTS (
        SELECT 1 FROM ${this.TABLE} e2
        WHERE e2.fileId = e1.fileId
        AND e2.status = 'pending'
        AND e2.timestamp < e1.timestamp
      )
      ORDER BY e1.timestamp ASC
      LIMIT 1
    `;

    const params = [now, ...lockedFileIds];
    const row = QueryBuilder.selectOne<EventRow>(sql, params);
    return row ? this.parseEvent(row) : undefined;
  }

  static markProcessing(_id: string): void {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'processing',
          lockedAt = ?
      WHERE _id = ?
    `;
    QueryBuilder.execute(sql, [Date.now(), _id]);
  }

  static markProcessed(_id: string): void {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'processed',
          lockedAt = NULL
      WHERE _id = ?
    `;
    QueryBuilder.execute(sql, [_id]);
  }

  static scheduleRetry(_id: string, errorMsg: string): void {
    const event = this.findById(_id);
    if (!event) return;

    const delay = RETRY_DELAYS_MS[Math.min(event.retryCount, RETRY_DELAYS_MS.length - 1)];
    const nextRetryAt = Date.now() + delay;

    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          retryCount = retryCount + 1,
          lastError = ?,
          nextRetryAt = ?,
          lockedAt = NULL
      WHERE _id = ?
    `;
    QueryBuilder.execute(sql, [errorMsg, nextRetryAt, _id]);
  }

  static markFailed(_id: string, errorMsg: string): void {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'failed',
          lastError = ?,
          lockedAt = NULL
      WHERE _id = ?
    `;
    QueryBuilder.execute(sql, [errorMsg, _id]);
  }

  static resetStaleEvents(staleThreshold: number): number {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          lockedAt = NULL
      WHERE status = 'processing'
      AND lockedAt IS NOT NULL
      AND lockedAt < ?
    `;
    const result = QueryBuilder.execute(sql, [staleThreshold]);
    return result.changes;
  }

  private static parseEvent(row: EventRow): Event {
    return {
      _id: row._id,
      type: row.type as EventType,
      timestamp: row.timestamp,
      fileId: row.fileId,
      status: row.status as EventStatus,
      retryCount: row.retryCount,
      lastError: row.lastError,
      lockedAt: row.lockedAt,
      nextRetryAt: row.nextRetryAt,
    };
  }
}
