import type { DatabaseSync } from 'node:sqlite';
import type { AuditEvent, AuditEventType } from '@tokenpilot/contracts';
import { randomUUID } from 'node:crypto';

export class AuditLogger {
  constructor(private db: DatabaseSync) {}

  log(
    type: AuditEventType,
    message: string,
    options: {
      jobId?: string | null;
      severity?: 'info' | 'warn' | 'error' | 'security';
      details?: Record<string, unknown>;
    } = {}
  ): AuditEvent {
    const event: AuditEvent = {
      id: randomUUID(),
      jobId: options.jobId ?? null,
      type,
      severity: options.severity ?? 'info',
      message,
      detailsJson: options.details ?? {},
      timestamp: new Date().toISOString()
    };

    const stmt = this.db.prepare(`
      INSERT INTO audit_events (id, job_id, type, severity, message, details_json, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id,
      event.jobId,
      event.type,
      event.severity,
      event.message,
      JSON.stringify(event.detailsJson),
      event.timestamp
    );

    return event;
  }

  getEvents(options: { jobId?: string; limit?: number } = {}): AuditEvent[] {
    let sql = 'SELECT * FROM audit_events';
    const params: unknown[] = [];

    if (options.jobId) {
      sql += ' WHERE job_id = ?';
      params.push(options.jobId);
    }

    sql += ' ORDER BY timestamp DESC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = (this.db.prepare(sql).all as Function)(...params) as Array<{
      id: string;
      job_id: string | null;
      type: string;
      severity: string;
      message: string;
      details_json: string;
      timestamp: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      type: r.type as AuditEventType,
      severity: r.severity as 'info' | 'warn' | 'error' | 'security',
      message: r.message,
      detailsJson: r.details_json ? JSON.parse(r.details_json) : {},
      timestamp: r.timestamp
    }));
  }
}
