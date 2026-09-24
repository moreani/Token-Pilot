export type AuditEventType =
  | 'QUOTA_REFRESHED'
  | 'JOB_CREATED'
  | 'JOB_CONFIGURED'
  | 'PREFLIGHT_PASSED'
  | 'PREFLIGHT_FAILED'
  | 'AUTHORIZATION_REQUESTED'
  | 'JOB_AUTHORIZED'
  | 'AUTHORIZATION_INVALIDATED'
  | 'SANDBOX_PREPARATION_STARTED'
  | 'SANDBOX_READY'
  | 'EXECUTION_STARTED'
  | 'JOB_PAUSED'
  | 'JOB_RESUMED'
  | 'JOB_STOPPED'
  | 'JOB_COMPLETED'
  | 'JOB_FAILED'
  | 'JOB_FAILOVER'
  | 'SECURITY_VIOLATION'
  | 'ARTIFACTS_EXPORTED'
  | 'SANDBOX_CLEANED';


export interface AuditEvent {
  id: string;
  jobId: string | null;
  type: AuditEventType;
  severity: 'info' | 'warn' | 'error' | 'security';
  message: string;
  detailsJson: Record<string, unknown>;
  timestamp: string;
}
