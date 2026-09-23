import type { NetworkPolicy } from './job.js';

export interface SandboxMount {
  hostPath?: string;
  containerPath: string;
  readOnly: boolean;
  type: 'volume' | 'tmpfs' | 'bind';
}

export interface SandboxSpec {
  jobId: string;
  image: string;
  cpuLimit: number;
  memoryMb: number;
  pidsLimit: number;
  timeoutMs: number;
  networkPolicy: NetworkPolicy;
  env: Record<string, string>;
  mounts: SandboxMount[];
}

export interface SandboxHandle {
  id: string;
  jobId: string;
  createdAt: string;
  status: 'running' | 'paused' | 'stopped' | 'destroyed';
}

export interface CommandSpec {
  executable: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export interface SandboxDoctorResult {
  engine: 'docker' | 'podman' | 'mock' | 'none';
  available: boolean;
  version?: string;
  error?: string;
}

export interface ExportBundle {
  jobId: string;
  files: Array<{
    path: string;
    content: string | Uint8Array;
    sizeBytes: number;
  }>;
}

export interface SandboxProvider {
  doctor(): Promise<SandboxDoctorResult>;
  create(spec: SandboxSpec): Promise<SandboxHandle>;
  exec(handle: SandboxHandle, command: CommandSpec): Promise<CommandResult>;
  pause(handle: SandboxHandle): Promise<void>;
  resume(handle: SandboxHandle): Promise<void>;
  stop(handle: SandboxHandle): Promise<void>;
  destroy(handle: SandboxHandle): Promise<void>;
  exportFiles(handle: SandboxHandle, paths: string[]): Promise<ExportBundle>;
}
