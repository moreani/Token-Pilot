import { randomUUID } from 'node:crypto';
import type {
  CommandResult,
  CommandSpec,
  ExportBundle,
  SandboxDoctorResult,
  SandboxHandle,
  SandboxProvider,
  SandboxSpec
} from '@tokenpilot/contracts';

export class MockSandboxProvider implements SandboxProvider {
  private activeSandboxes: Map<string, SandboxHandle> = new Map();

  async doctor(): Promise<SandboxDoctorResult> {
    return {
      engine: 'mock',
      available: true,
      version: 'mock-sandbox-1.0.0',
      error: undefined
    };
  }

  async create(spec: SandboxSpec): Promise<SandboxHandle> {
    // Assert security policy invariants
    for (const mount of spec.mounts) {
      if (mount.hostPath && (mount.hostPath.includes('/.ssh') || mount.hostPath === process.env.HOME)) {
        throw new Error('SECURITY VIOLATION: Host sensitive directories cannot be mounted in sandbox!');
      }
    }

    const handle: SandboxHandle = {
      id: randomUUID(),
      jobId: spec.jobId,
      createdAt: new Date().toISOString(),
      status: 'running'
    };

    this.activeSandboxes.set(handle.id, handle);
    return handle;
  }

  async exec(handle: SandboxHandle, command: CommandSpec): Promise<CommandResult> {
    const sandbox = this.activeSandboxes.get(handle.id);
    if (!sandbox || sandbox.status !== 'running') {
      throw new Error(`Sandbox ${handle.id} is not running (status: ${sandbox?.status})`);
    }

    // Mock command execution
    return {
      exitCode: 0,
      stdout: `[MockSandbox ${handle.id}] Successfully executed: ${command.executable} ${command.args.join(' ')}\nAll checks passed.`,
      stderr: '',
      durationMs: 120
    };
  }

  async pause(handle: SandboxHandle): Promise<void> {
    const sandbox = this.activeSandboxes.get(handle.id);
    if (sandbox) {
      sandbox.status = 'paused';
    }
  }

  async resume(handle: SandboxHandle): Promise<void> {
    const sandbox = this.activeSandboxes.get(handle.id);
    if (sandbox) {
      sandbox.status = 'running';
    }
  }

  async stop(handle: SandboxHandle): Promise<void> {
    const sandbox = this.activeSandboxes.get(handle.id);
    if (sandbox) {
      sandbox.status = 'stopped';
    }
  }

  async destroy(handle: SandboxHandle): Promise<void> {
    this.activeSandboxes.delete(handle.id);
  }

  async exportFiles(handle: SandboxHandle, paths: string[]): Promise<ExportBundle> {
    return {
      jobId: handle.jobId,
      files: paths.map((p) => ({
        path: p,
        content: `// Exported artifact from mock sandbox for ${p}\n// Validated and safe for export.`,
        sizeBytes: 128
      }))
    };
  }
}
