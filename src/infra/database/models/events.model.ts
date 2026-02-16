import { QueryBuilder } from "../index.js";
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
  portalAddress: string;
  status: string;
  retryCount: number;
  lastError: string | null;
  lockedAt: number | null;
  nextRetryAt: number | null;
  userOpHash?: string | null;
  pendingPayload?: string | null;
}

export class EventsModel {
  private static readonly TABLE = "events";

  static async create(input: { type: EventType; fileId: string; portalAddress: string }): Promise<Event> {
    const _id = uuidv7();
    const timestamp = Date.now();
    const status: EventStatus = "pending";

    const sql = `
      INSERT INTO ${this.TABLE}
      (_id, type, timestamp, fileId, portalAddress, status, retryCount, lastError, lockedAt, nextRetryAt)
      VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, NULL)
    `;

    await QueryBuilder.execute(sql, [_id, input.type, timestamp, input.fileId, input.portalAddress, status]);

    notifyNewEvent();

    return {
      _id,
      type: input.type,
      timestamp,
      fileId: input.fileId,
      portalAddress: input.portalAddress,
      status,
      retryCount: 0,
      lastError: null,
      lockedAt: null,
      nextRetryAt: null,
    };
  }

  static async findById(_id: string): Promise<Event | undefined> {
    const sql = `SELECT * FROM ${this.TABLE} WHERE _id = ?`;
    const row = await QueryBuilder.selectOne<EventRow>(sql, [_id]);
    return row ? this.parseEvent(row) : undefined;
  }

  static async findNextPending(): Promise<Event | undefined> {
    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE status = 'pending'
      ORDER BY timestamp ASC
      LIMIT 1
    `;
    const row = await QueryBuilder.selectOne<EventRow>(sql, []);
    return row ? this.parseEvent(row) : undefined;
  }

  static async findNextEligible(lockedFileIds: string[]): Promise<Event | undefined> {
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
    const row = await QueryBuilder.selectOne<EventRow>(sql, params);
    return row ? this.parseEvent(row) : undefined;
  }

  static async markProcessing(_id: string): Promise<void> {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'processing',
          lockedAt = ?
      WHERE _id = ?
    `;
    await QueryBuilder.execute(sql, [Date.now(), _id]);
  }

  static async markProcessed(_id: string): Promise<void> {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'processed',
          lockedAt = NULL
      WHERE _id = ?
    `;
    await QueryBuilder.execute(sql, [_id]);
  }

  static async scheduleRetry(_id: string, errorMsg: string): Promise<void> {
    const event = await this.findById(_id);
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
    await QueryBuilder.execute(sql, [errorMsg, nextRetryAt, _id]);
  }

  static async scheduleRetryAfter(_id: string, errorMsg: string, retryAfterMs: number): Promise<void> {
    const nextRetryAt = Date.now() + retryAfterMs;
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          lastError = ?,
          nextRetryAt = ?,
          lockedAt = NULL
      WHERE _id = ?
    `;
    await QueryBuilder.execute(sql, [errorMsg, nextRetryAt, _id]);
  }

  static async markFailed(_id: string, errorMsg: string): Promise<void> {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'failed',
          lastError = ?,
          lockedAt = NULL
      WHERE _id = ?
    `;
    await QueryBuilder.execute(sql, [errorMsg, _id]);
  }

  static async listFailed(portalAddress?: string): Promise<Event[]> {
    const portalClause = portalAddress != null ? "AND portalAddress = ?" : "";
    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE status = 'failed'
      ${portalClause}
      ORDER BY timestamp ASC
    `;
    const params = portalAddress != null ? [portalAddress] : [];
    const rows = await QueryBuilder.select<EventRow>(sql, params);
    return rows.map((row) => this.parseEvent(row));
  }

  static async resetFailedToPending(_id: string, portalAddress?: string): Promise<boolean> {
    const portalClause = portalAddress != null ? "AND portalAddress = ?" : "";
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          retryCount = 0,
          lastError = NULL,
          nextRetryAt = NULL,
          lockedAt = NULL
      WHERE _id = ?
      AND status = 'failed'
      ${portalClause}
    `;
    const params = portalAddress != null ? [_id, portalAddress] : [_id];
    const result = await QueryBuilder.execute(sql, params);
    if (result.changes > 0) {
      notifyNewEvent();
    }
    return result.changes > 0;
  }

  static async resetAllFailedToPending(portalAddress?: string): Promise<number> {
    const portalClause = portalAddress != null ? "AND portalAddress = ?" : "";
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          retryCount = 0,
          lastError = NULL,
          nextRetryAt = NULL,
          lockedAt = NULL
      WHERE status = 'failed'
      ${portalClause}
    `;
    const params = portalAddress != null ? [portalAddress] : [];
    const result = await QueryBuilder.execute(sql, params);
    if (result.changes > 0) {
      notifyNewEvent();
    }
    return result.changes;
  }

  static async resetStaleEvents(staleThreshold: number): Promise<number> {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'pending',
          lockedAt = NULL,
          userOpHash = NULL,
          pendingPayload = NULL
      WHERE status = 'processing'
      AND lockedAt IS NOT NULL
      AND lockedAt < ?
    `;
    const result = await QueryBuilder.execute(sql, [staleThreshold]);
    return result.changes;
  }

  static async setEventPendingOp(_id: string, userOpHash: string, payload: Record<string, unknown>): Promise<void> {
    const sql = `UPDATE ${this.TABLE} SET userOpHash = ?, pendingPayload = ? WHERE _id = ?`;
    await QueryBuilder.execute(sql, [userOpHash, JSON.stringify(payload), _id]);
  }

  static async clearEventPendingOp(_id: string): Promise<void> {
    const sql = `UPDATE ${this.TABLE} SET userOpHash = NULL, pendingPayload = NULL WHERE _id = ?`;
    await QueryBuilder.execute(sql, [_id]);
  }

  static async markSubmitted(_id: string, userOpHash: string, payload: Record<string, unknown>): Promise<void> {
    const sql = `
      UPDATE ${this.TABLE}
      SET status = 'submitted',
          lockedAt = NULL,
          userOpHash = ?,
          pendingPayload = ?
      WHERE _id = ?
    `;
    await QueryBuilder.execute(sql, [userOpHash, JSON.stringify(payload), _id]);
  }

  static async findNextSubmitted(lockedFileIds: string[]): Promise<Event | undefined> {
    const exclusionClause =
      lockedFileIds.length > 0 ? `AND fileId NOT IN (${lockedFileIds.map(() => "?").join(", ")})` : "";

    const sql = `
      SELECT * FROM ${this.TABLE}
      WHERE status = 'submitted'
      AND userOpHash IS NOT NULL
      ${exclusionClause}
      ORDER BY timestamp ASC
      LIMIT 1
    `;

    const params = [...lockedFileIds];
    const row = await QueryBuilder.selectOne<EventRow>(sql, params);
    return row ? this.parseEvent(row) : undefined;
  }

  private static parseEvent(row: EventRow): Event {
    return {
      _id: row._id,
      type: row.type as EventType,
      timestamp: row.timestamp,
      fileId: row.fileId,
      portalAddress: row.portalAddress ?? "",
      status: row.status as EventStatus,
      retryCount: row.retryCount,
      lastError: row.lastError,
      lockedAt: row.lockedAt,
      nextRetryAt: row.nextRetryAt,
      userOpHash: row.userOpHash ?? null,
      pendingPayload: row.pendingPayload ?? null,
    };
  }
}
