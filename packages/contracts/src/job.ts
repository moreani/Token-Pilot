export type JobType =
  | 'repo_scout'
  | 'repo_lab'
  | 'skill_hunter'
  | 'skill_lab'
  | 'website_study'
  | 'website_recreate'
  | 'benchmark'
  | 'research'
  | 'custom_job';

export type JobState =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'READY_FOR_REVIEW'
  | 'PREFLIGHT'
  | 'AWAITING_CONFIRMATION'
  | 'AUTHORIZED'
  | 'PREPARING_SANDBOX'
  | 'SANDBOX_READY'
  | 'STARTING_AGENT'
  | 'RUNNING'
  | 'PAUSING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SECURITY_BLOCKED';

export type NetworkPolicy = 'none' | 'public_web_only' | 'sandbox_isolated' | 'custom_allowlist';

export interface JobSecurityProfile {
  id: string;
  name: string;
  isolationLevel: 'balanced_sandbox' | 'strict_airgap';
  networkPolicy: NetworkPolicy;
  allowedHosts: string[];
  cpuLimit: number;
  memoryMb: number;
  timeoutMs: number;
  readOnlyRoot: boolean;
  disallowHostMounts: true;
  dropCapabilities: true;
}

export interface RepoLabSpec {
  repoUrl: string;
  targetBranch?: string;
  objective: string;
  depth: 'shallow' | 'standard' | 'deep';
  runTests: boolean;
  generateFixes: boolean;
}

export interface JobPermissions {
  network: NetworkPolicy;
  allowedHosts: string[];
  maxTokensEstimate?: number;
  timeoutMs: number;
  allowPublicWebOnly: boolean;
  disallowHostFilesystem: true;
  disallowDockerSocket: true;
  disallowPrivateNetwork: true;
}

export interface AccountPoolItem {
  accountId: string;
  providerId: string;
  displayAlias?: string;
  priority: number;
  status: 'active' | 'exhausted' | 'standby';
}

export interface FailoverEvent {
  fromAccountId: string;
  toAccountId: string;
  reason: string;
  timestamp: string;
}

export interface Job {
  id: string;
  type: JobType;
  name: string;
  objective: string;
  state: JobState;
  providerId: string | null;
  accountId: string | null;
  accountPool?: AccountPoolItem[];
  failoverHistory?: FailoverEvent[];
  securityProfileId: string;
  spec: RepoLabSpec | Record<string, unknown>;
  permissions: JobPermissions;
  createdAt: string;
  updatedAt: string;
  authorizedAt: string | null;
  firstExecutionAt: string | null;
  completedAt: string | null;
  failureReason?: string | null;
}

export interface ExecutionIntent {
  jobId: string;
  userConfirmed: true;
  confirmedAt: string;
  providerId: string;
  accountId: string;
  securityProfileId: string;
  jobSpecHash: string;
  permissionsHash: string;
}

export interface ArtifactManifestItem {
  id: string;
  name: string;
  relativePath: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
}

export interface JobResult {
  jobId: string;
  summaryMarkdown: string | null;
  resultJson: unknown | null;
  artifactManifest: ArtifactManifestItem[];
  quotaBeforeJson: unknown | null;
  quotaAfterJson: unknown | null;
}
