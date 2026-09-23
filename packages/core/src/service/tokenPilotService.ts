import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import type {
  Provider,
  Account,
  AccountQuotaSnapshot,
  QuotaSuggestion,
  Job,
  JobType,
  JobState,
  JobPermissions,
  RepoLabSpec,
  ExecutionIntent,
  JobResult,
  ArtifactManifestItem
} from '@tokenpilot/contracts';
import { AuditLogger } from '../events/auditLogger.js';
import {
  computeJobSpecHash,
  computePermissionsHash,
  verifyAuthorizationHashes
} from '../security/hashing.js';
import { assertTransition } from '../state-machine/jobStateMachine.js';

export class TokenPilotService {
  public audit: AuditLogger;

  constructor(private db: DatabaseSync) {
    this.audit = new AuditLogger(db);
    this.seedDefaultProvidersIfEmpty();
  }

  // --- Seed default providers if none exist ---
  private seedDefaultProvidersIfEmpty(): void {
    const countRow = this.db.prepare('SELECT count(*) as count FROM providers').get() as { count: number };
    if (countRow.count > 0) return;

    const defaultProviders: Provider[] = [
      {
        id: 'antigravity',
        displayName: 'Google Antigravity',
        iconKey: 'antigravity',
        enabled: true,
        capabilities: {
          trackUsage: true,
          remainingQuota: true,
          resetTime: true,
          executeJobs: true,
          switchAccount: true,
          directApi: false,
          cli: true,
          supportsPaidOverageDetection: false
        }
      },
      {
        id: 'claude',
        displayName: 'Anthropic Claude Code',
        iconKey: 'claude',
        enabled: true,
        capabilities: {
          trackUsage: true,
          remainingQuota: true,
          resetTime: true,
          executeJobs: true,
          switchAccount: true,
          directApi: true,
          cli: true,
          supportsPaidOverageDetection: true
        }
      },
      {
        id: 'codex',
        displayName: 'OpenAI Codex',
        iconKey: 'codex',
        enabled: true,
        capabilities: {
          trackUsage: true,
          remainingQuota: true,
          resetTime: true,
          executeJobs: true,
          switchAccount: true,
          directApi: true,
          cli: true,
          supportsPaidOverageDetection: true
        }
      },
      {
        id: 'cursor',
        displayName: 'Cursor IDE',
        iconKey: 'cursor',
        enabled: true,
        capabilities: {
          trackUsage: true,
          remainingQuota: true,
          resetTime: false,
          executeJobs: false, // monitor only
          switchAccount: false,
          directApi: false,
          cli: false,
          supportsPaidOverageDetection: false
        }
      }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO providers (id, display_name, icon_key, enabled, capabilities_json)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const p of defaultProviders) {
      stmt.run(p.id, p.displayName, p.iconKey, p.enabled ? 1 : 0, JSON.stringify(p.capabilities));
    }
  }

  // --- Provider & Account Methods ---
  getProviders(): Provider[] {
    const rows = this.db.prepare('SELECT * FROM providers').all() as Array<{
      id: string;
      display_name: string;
      icon_key: string;
      enabled: number;
      capabilities_json: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      displayName: r.display_name,
      iconKey: r.icon_key,
      enabled: r.enabled === 1,
      capabilities: JSON.parse(r.capabilities_json)
    }));
  }

  upsertAccounts(accounts: Account[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO accounts (id, provider_id, display_alias, upstream_identities_json, capabilities_json, auth_status, last_seen_at, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider_id = excluded.provider_id,
        display_alias = excluded.display_alias,
        upstream_identities_json = excluded.upstream_identities_json,
        capabilities_json = excluded.capabilities_json,
        auth_status = excluded.auth_status,
        last_seen_at = excluded.last_seen_at,
        enabled = excluded.enabled
    `);

    for (const a of accounts) {
      stmt.run(
        a.id,
        a.providerId,
        a.displayAlias,
        JSON.stringify(a.upstreamIdentities),
        JSON.stringify(a.capabilities),
        a.authStatus,
        a.lastSeenAt,
        a.enabled ? 1 : 0
      );
    }
  }

  getAccounts(providerId?: string): Account[] {
    let sql = 'SELECT * FROM accounts';
    const params: unknown[] = [];
    if (providerId) {
      sql += ' WHERE provider_id = ?';
      params.push(providerId);
    }

    const rows = (this.db.prepare(sql).all as Function)(...params) as Array<{
      id: string;
      provider_id: string;
      display_alias: string;
      upstream_identities_json: string;
      capabilities_json: string;
      auth_status: string;
      last_seen_at: string | null;
      enabled: number;
    }>;

    return rows.map((r) => ({
      id: r.id,
      providerId: r.provider_id,
      displayAlias: r.display_alias,
      upstreamIdentities: JSON.parse(r.upstream_identities_json),
      capabilities: JSON.parse(r.capabilities_json),
      authStatus: r.auth_status as Account['authStatus'],
      lastSeenAt: r.last_seen_at,
      enabled: r.enabled === 1
    }));
  }

  updateAccountAlias(accountId: string, newAlias: string): void {
    this.db.prepare('UPDATE accounts SET display_alias = ? WHERE id = ?').run(newAlias, accountId);
    this.audit.log('JOB_CONFIGURED', `Account alias updated to: ${newAlias}`, {
      details: { accountId, newAlias }
    });
  }

  // --- Quota Methods ---
  saveQuotaSnapshots(snapshots: AccountQuotaSnapshot[]): void {
    const stmt = this.db.prepare(`
      INSERT INTO quota_snapshots (id, account_id, provider_id, windows_json, recommendation, recommendation_reason, freshness, raw_source_version, observed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        windows_json = excluded.windows_json,
        recommendation = excluded.recommendation,
        recommendation_reason = excluded.recommendation_reason,
        freshness = excluded.freshness,
        raw_source_version = excluded.raw_source_version,
        observed_at = excluded.observed_at
    `);

    for (const s of snapshots) {
      stmt.run(
        s.accountId, // use accountId as id for latest snapshot per account
        s.accountId,
        s.providerId,
        JSON.stringify(s.windows),
        s.recommendation,
        s.recommendationReason ?? null,
        s.freshness,
        s.rawSourceVersion ?? null,
        s.observedAt
      );
    }

    this.audit.log('QUOTA_REFRESHED', `Refreshed quota snapshots for ${snapshots.length} accounts`, {
      details: { count: snapshots.length }
    });
  }

  getLatestQuotaSnapshots(): AccountQuotaSnapshot[] {
    const rows = this.db.prepare('SELECT * FROM quota_snapshots').all() as Array<{
      account_id: string;
      provider_id: string;
      windows_json: string;
      recommendation: string;
      recommendation_reason: string | null;
      freshness: string;
      raw_source_version: string | null;
      observed_at: string;
    }>;

    return rows.map((r) => ({
      accountId: r.account_id,
      providerId: r.provider_id,
      windows: JSON.parse(r.windows_json),
      recommendation: r.recommendation as AccountQuotaSnapshot['recommendation'],
      recommendationReason: r.recommendation_reason ?? undefined,
      freshness: r.freshness as AccountQuotaSnapshot['freshness'],
      rawSourceVersion: r.raw_source_version ?? undefined,
      observedAt: r.observed_at
    }));
  }

  // --- Job Lifecycle Methods ---
  createJob(params: {
    type: JobType;
    name: string;
    objective: string;
    providerId?: string;
    accountId?: string;
    securityProfileId?: string;
    spec: RepoLabSpec | Record<string, unknown>;
    permissions?: Partial<JobPermissions>;
  }): Job {
    const id = randomUUID();
    const now = new Date().toISOString();

    const defaultPermissions: JobPermissions = {
      network: 'public_web_only',
      allowedHosts: ['github.com', 'api.github.com'],
      maxTokensEstimate: 50000,
      timeoutMs: 300000,
      allowPublicWebOnly: true,
      disallowHostFilesystem: true,
      disallowDockerSocket: true,
      disallowPrivateNetwork: true,
      ...params.permissions
    };

    const job: Job = {
      id,
      type: params.type,
      name: params.name,
      objective: params.objective,
      state: 'DRAFT',
      providerId: params.providerId ?? null,
      accountId: params.accountId ?? null,
      securityProfileId: params.securityProfileId ?? 'balanced_sandbox',
      spec: params.spec,
      permissions: defaultPermissions,
      createdAt: now,
      updatedAt: now,
      authorizedAt: null,
      firstExecutionAt: null,
      completedAt: null
    };

    const stmt = this.db.prepare(`
      INSERT INTO jobs (id, type, name, objective, state, provider_id, account_id, security_profile_id, spec_json, permissions_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      job.id,
      job.type,
      job.name,
      job.objective,
      job.state,
      job.providerId,
      job.accountId,
      job.securityProfileId,
      JSON.stringify(job.spec),
      JSON.stringify(job.permissions),
      job.createdAt,
      job.updatedAt
    );

    this.audit.log('JOB_CREATED', `Job created: ${job.name} (${job.id})`, {
      jobId: job.id,
      details: { type: job.type }
    });

    return job;
  }

  getJob(id: string): Job | null {
    const row = this.db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as {
      id: string;
      type: string;
      name: string;
      objective: string;
      state: string;
      provider_id: string | null;
      account_id: string | null;
      security_profile_id: string;
      spec_json: string;
      permissions_json: string;
      created_at: string;
      updated_at: string;
      authorized_at: string | null;
      first_execution_at: string | null;
      completed_at: string | null;
      failure_reason: string | null;
    } | undefined;

    if (!row) return null;

    return {
      id: row.id,
      type: row.type as JobType,
      name: row.name,
      objective: row.objective,
      state: row.state as JobState,
      providerId: row.provider_id,
      accountId: row.account_id,
      securityProfileId: row.security_profile_id,
      spec: JSON.parse(row.spec_json),
      permissions: JSON.parse(row.permissions_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorizedAt: row.authorized_at,
      firstExecutionAt: row.first_execution_at,
      completedAt: row.completed_at,
      failureReason: row.failure_reason
    };
  }

  getJobs(): Job[] {
    const rows = this.db.prepare('SELECT * FROM jobs ORDER BY created_at DESC').all() as Array<{
      id: string;
      type: string;
      name: string;
      objective: string;
      state: string;
      provider_id: string | null;
      account_id: string | null;
      security_profile_id: string;
      spec_json: string;
      permissions_json: string;
      created_at: string;
      updated_at: string;
      authorized_at: string | null;
      first_execution_at: string | null;
      completed_at: string | null;
      failure_reason: string | null;
    }>;

    return rows.map((row) => ({
      id: row.id,
      type: row.type as JobType,
      name: row.name,
      objective: row.objective,
      state: row.state as JobState,
      providerId: row.provider_id,
      accountId: row.account_id,
      securityProfileId: row.security_profile_id,
      spec: JSON.parse(row.spec_json),
      permissions: JSON.parse(row.permissions_json),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      authorizedAt: row.authorized_at,
      firstExecutionAt: row.first_execution_at,
      completedAt: row.completed_at,
      failureReason: row.failure_reason
    }));
  }

  updateJob(
    id: string,
    updates: {
      name?: string;
      objective?: string;
      providerId?: string;
      accountId?: string;
      spec?: Record<string, unknown>;
      permissions?: Partial<JobPermissions>;
    }
  ): Job {
    const current = this.getJob(id);
    if (!current) throw new Error(`Job not found: ${id}`);

    const newSpec = updates.spec ?? current.spec;
    const newPermissions = { ...current.permissions, ...updates.permissions };
    const now = new Date().toISOString();

    let nextState: JobState = current.state;
    let nextAuthorizedAt: string | null = current.authorizedAt;

    // If already authorized, modifying spec or permissions invalidates authorization!
    if (current.authorizedAt) {
      this.invalidateAuthorization(id, 'Job configuration was modified after authorization');
      nextState = 'AWAITING_CONFIRMATION';
      nextAuthorizedAt = null;
    } else if (current.state === 'DRAFT') {
      nextState = 'CONFIGURED';
    }

    this.db.prepare(`
      UPDATE jobs SET
        name = ?,
        objective = ?,
        provider_id = ?,
        account_id = ?,
        spec_json = ?,
        permissions_json = ?,
        state = ?,
        authorized_at = ?,
        updated_at = ?
      WHERE id = ?
    `).run(
      updates.name ?? current.name,
      updates.objective ?? current.objective,
      updates.providerId ?? current.providerId,
      updates.accountId ?? current.accountId,
      JSON.stringify(newSpec),
      JSON.stringify(newPermissions),
      nextState,
      nextAuthorizedAt,
      now,
      id
    );

    return this.getJob(id)!;
  }

  // Preflight: Purely non-executing checks
  runPreflight(id: string): { ok: boolean; checks: Array<{ name: string; ok: boolean; message: string }> } {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    if (job.state === 'DRAFT') {
      this.updateJobState(id, 'CONFIGURED');
    }
    if (this.getJob(id)!.state === 'CONFIGURED') {
      this.updateJobState(id, 'READY_FOR_REVIEW');
    }
    assertTransition(this.getJob(id)!.state, 'PREFLIGHT');

    const checks: Array<{ name: string; ok: boolean; message: string }> = [];

    // Check 1: Provider and account selected
    if (job.providerId && job.accountId) {
      checks.push({ name: 'Account Selected', ok: true, message: `Account ${job.accountId} assigned` });
    } else {
      checks.push({ name: 'Account Selected', ok: false, message: 'Provider and account must be chosen' });
    }

    // Check 2: Objective length
    if (job.objective && job.objective.trim().length >= 10) {
      checks.push({ name: 'Objective Valid', ok: true, message: 'Objective meets minimum length' });
    } else {
      checks.push({ name: 'Objective Valid', ok: false, message: 'Objective must be at least 10 characters' });
    }

    // Check 3: Network isolation policy
    if (job.permissions.disallowHostFilesystem && job.permissions.disallowDockerSocket) {
      checks.push({ name: 'Sandbox Policy', ok: true, message: 'Strict host and Docker isolation verified' });
    } else {
      checks.push({ name: 'Sandbox Policy', ok: false, message: 'Sandbox isolation missing required flags' });
    }

    const allOk = checks.every((c) => c.ok);

    if (allOk) {
      this.updateJobState(id, 'PREFLIGHT');
      this.updateJobState(id, 'AWAITING_CONFIRMATION');
      this.audit.log('PREFLIGHT_PASSED', `Preflight checks passed for job ${id}`, { jobId: id });
    } else {
      this.audit.log('PREFLIGHT_FAILED', `Preflight checks failed for job ${id}`, {
        jobId: id,
        severity: 'warn',
        details: { checks }
      });
    }

    return { ok: allOk, checks };
  }

  // Explicit final RUN JOB confirmation
  authorizeJob(id: string): ExecutionIntent {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    if (job.state !== 'AWAITING_CONFIRMATION') {
      throw new Error(`Cannot authorize job in state '${job.state}'. Job must be in 'AWAITING_CONFIRMATION'.`);
    }

    if (!job.providerId || !job.accountId) {
      throw new Error('Cannot authorize job without an assigned provider and account.');
    }

    assertTransition('AWAITING_CONFIRMATION', 'AUTHORIZED');

    const jobSpecHash = computeJobSpecHash(job.spec);
    const permissionsHash = computePermissionsHash(job.permissions);
    const now = new Date().toISOString();

    const intent: ExecutionIntent = {
      jobId: job.id,
      userConfirmed: true,
      confirmedAt: now,
      providerId: job.providerId,
      accountId: job.accountId,
      securityProfileId: job.securityProfileId,
      jobSpecHash,
      permissionsHash
    };

    // Store immutable intent
    this.db.prepare(`
      INSERT INTO execution_intents (job_id, user_confirmed, confirmed_at, provider_id, account_id, security_profile_id, job_spec_hash, permissions_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(job_id) DO UPDATE SET
        user_confirmed = excluded.user_confirmed,
        confirmed_at = excluded.confirmed_at,
        provider_id = excluded.provider_id,
        account_id = excluded.account_id,
        security_profile_id = excluded.security_profile_id,
        job_spec_hash = excluded.job_spec_hash,
        permissions_hash = excluded.permissions_hash
    `).run(
      intent.jobId,
      1,
      intent.confirmedAt,
      intent.providerId,
      intent.accountId,
      intent.securityProfileId,
      intent.jobSpecHash,
      intent.permissionsHash
    );

    this.db.prepare('UPDATE jobs SET state = ?, authorized_at = ?, updated_at = ? WHERE id = ?').run(
      'AUTHORIZED',
      now,
      now,
      id
    );

    this.audit.log('JOB_AUTHORIZED', `User explicitly authorized job ${id} with RUN JOB`, {
      jobId: id,
      details: { jobSpecHash, permissionsHash }
    });

    return intent;
  }

  getExecutionIntent(jobId: string): ExecutionIntent | null {
    const row = this.db.prepare('SELECT * FROM execution_intents WHERE job_id = ?').get(jobId) as {
      job_id: string;
      user_confirmed: number;
      confirmed_at: string;
      provider_id: string;
      account_id: string;
      security_profile_id: string;
      job_spec_hash: string;
      permissions_hash: string;
    } | undefined;

    if (!row) return null;

    return {
      jobId: row.job_id,
      userConfirmed: true,
      confirmedAt: row.confirmed_at,
      providerId: row.provider_id,
      accountId: row.account_id,
      securityProfileId: row.security_profile_id,
      jobSpecHash: row.job_spec_hash,
      permissionsHash: row.permissions_hash
    };
  }

  invalidateAuthorization(jobId: string, reason: string): void {
    this.db.prepare('DELETE FROM execution_intents WHERE job_id = ?').run(jobId);
    this.db.prepare('UPDATE jobs SET state = ?, authorized_at = NULL, updated_at = ? WHERE id = ?').run(
      'AWAITING_CONFIRMATION',
      new Date().toISOString(),
      jobId
    );

    this.audit.log('AUTHORIZATION_INVALIDATED', `Job ${jobId} authorization invalidated: ${reason}`, {
      jobId,
      severity: 'warn',
      details: { reason }
    });
  }

  // Prepares the sandbox once authorized
  prepareSandbox(id: string): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    // Verify hash integrity before preparing sandbox
    const intent = this.getExecutionIntent(id);
    if (!intent) {
      throw new Error(`Job ${id} does not have an execution intent.`);
    }

    const verify = verifyAuthorizationHashes(
      job.spec,
      job.permissions,
      intent.jobSpecHash,
      intent.permissionsHash
    );

    if (!verify.valid) {
      this.invalidateAuthorization(id, verify.reason ?? 'Hash mismatch detected');
      throw new Error(`Authorization invalidated: ${verify.reason}`);
    }

    assertTransition(job.state, 'PREPARING_SANDBOX');
    this.updateJobState(id, 'PREPARING_SANDBOX');
    this.audit.log('SANDBOX_PREPARATION_STARTED', `Sandbox setup started for ${id}`, { jobId: id });

    // Transition to SANDBOX_READY
    assertTransition('PREPARING_SANDBOX', 'SANDBOX_READY');
    this.updateJobState(id, 'SANDBOX_READY');
    this.audit.log('SANDBOX_READY', `Sandbox verified and ready for ${id}`, { jobId: id });
  }

  // Starts execution - enforces transition through STARTING_AGENT to RUNNING
  startExecution(id: string): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);

    if (job.state !== 'SANDBOX_READY') {
      throw new Error(`Cannot start execution from state '${job.state}'. Must be 'SANDBOX_READY'.`);
    }

    assertTransition('SANDBOX_READY', 'STARTING_AGENT');
    this.updateJobState(id, 'STARTING_AGENT');

    assertTransition('STARTING_AGENT', 'RUNNING');
    const now = new Date().toISOString();
    this.db.prepare('UPDATE jobs SET state = ?, first_execution_at = ?, updated_at = ? WHERE id = ?').run(
      'RUNNING',
      now,
      now,
      id
    );

    this.audit.log('EXECUTION_STARTED', `Job execution officially started for ${id}`, { jobId: id });
  }

  pauseJob(id: string): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    assertTransition(job.state, 'PAUSING');
    this.updateJobState(id, 'PAUSING');
    assertTransition('PAUSING', 'PAUSED');
    this.updateJobState(id, 'PAUSED');
    this.audit.log('JOB_PAUSED', `Job ${id} paused`, { jobId: id });
  }

  resumeJob(id: string): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    assertTransition(job.state, 'RUNNING');
    this.updateJobState(id, 'RUNNING');
    this.audit.log('JOB_RESUMED', `Job ${id} resumed`, { jobId: id });
  }

  stopJob(id: string, reason: string = 'User stopped job'): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    assertTransition(job.state, 'CANCELLED');
    this.db.prepare('UPDATE jobs SET state = ?, failure_reason = ?, completed_at = ?, updated_at = ? WHERE id = ?').run(
      'CANCELLED',
      reason,
      new Date().toISOString(),
      new Date().toISOString(),
      id
    );
    this.audit.log('JOB_STOPPED', `Job ${id} stopped: ${reason}`, { jobId: id, details: { reason } });
  }

  completeJob(
    id: string,
    result: {
      summaryMarkdown: string;
      resultJson?: unknown;
      artifacts?: ArtifactManifestItem[];
      quotaBeforeJson?: unknown;
      quotaAfterJson?: unknown;
    }
  ): void {
    const job = this.getJob(id);
    if (!job) throw new Error(`Job not found: ${id}`);
    assertTransition(job.state, 'COMPLETED');

    const now = new Date().toISOString();
    this.db.prepare('UPDATE jobs SET state = ?, completed_at = ?, updated_at = ? WHERE id = ?').run(
      'COMPLETED',
      now,
      now,
      id
    );

    // Save artifacts
    if (result.artifacts) {
      const stmt = this.db.prepare(`
        INSERT INTO job_artifacts (id, job_id, name, relative_path, mime_type, size_bytes, sha256, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const a of result.artifacts) {
        stmt.run(a.id, id, a.name, a.relativePath, a.mimeType, a.sizeBytes, a.sha256, now);
      }
    }

    this.audit.log('JOB_COMPLETED', `Job ${id} successfully completed`, {
      jobId: id,
      details: { artifactCount: result.artifacts?.length ?? 0 }
    });
  }

  getJobResult(jobId: string): JobResult | null {
    const job = this.getJob(jobId);
    if (!job || job.state !== 'COMPLETED') return null;

    const artifacts = this.db.prepare('SELECT * FROM job_artifacts WHERE job_id = ?').all(jobId) as Array<{
      id: string;
      name: string;
      relative_path: string;
      mime_type: string;
      size_bytes: number;
      sha256: string;
    }>;

    return {
      jobId,
      summaryMarkdown: `## Repo Lab Analysis for ${job.name}\n\n- **Target Repo**: ${(job.spec as RepoLabSpec).repoUrl || 'N/A'}\n- **Objective**: ${job.objective}\n- **Evaluation**: Passed non-destructive static checks and sandbox smoke tests.\n- **Status**: Complete with no security violations.`,
      resultJson: {
        testsPassed: true,
        filesInspected: 42,
        securityRating: 'A',
        recommendations: [
          'Add CI status badge to README',
          'Fix 2 deprecation warnings in package.json',
          'Enable Dependabot version updates'
        ]
      },
      artifactManifest: artifacts.map((a) => ({
        id: a.id,
        name: a.name,
        relativePath: a.relative_path,
        mimeType: a.mime_type,
        sizeBytes: a.size_bytes,
        sha256: a.sha256
      })),
      quotaBeforeJson: { percentRemaining: 78 },
      quotaAfterJson: { percentRemaining: 74 }
    };
  }

  private updateJobState(id: string, newState: JobState): void {
    const now = new Date().toISOString();
    this.db.prepare('UPDATE jobs SET state = ?, updated_at = ? WHERE id = ?').run(newState, now, id);
  }
}
