import type {
  JobPermissions,
  ProviderCapabilities,
  RepoLabSpec
} from '@tokenpilot/contracts';
import type { JobPlan, JobPreview, JobTemplate, ValidationResult } from './jobTemplate.js';

export class RepoLabJobTemplate implements JobTemplate<RepoLabSpec> {
  id = 'repo_lab' as const;
  displayName = 'Repo Lab';

  describe(config: RepoLabSpec): JobPreview {
    return {
      title: `Repo Lab: ${config.repoUrl || 'Repository'}`,
      summary: `Safely clones and tests public repo inside an isolated sandbox to perform: ${config.objective}`,
      estimatedTokens: config.depth === 'deep' ? 80000 : config.depth === 'standard' ? 40000 : 20000,
      estimatedDurationMs: 180000
    };
  }

  validate(config: RepoLabSpec): ValidationResult {
    const errors: string[] = [];

    if (!config.repoUrl || typeof config.repoUrl !== 'string') {
      errors.push('Repository URL is required.');
    } else {
      const trimmed = config.repoUrl.trim();
      // Must be https://github.com/...
      if (!/^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(\/)?$/.test(trimmed)) {
        errors.push(
          'Repository URL must be a valid public GitHub URL (e.g. https://github.com/owner/repo).'
        );
      }
      // SSRF & Localhost checks (PRD Section 32 & 33)
      if (
        trimmed.includes('localhost') ||
        trimmed.includes('127.0.0.1') ||
        trimmed.includes('192.168.') ||
        trimmed.includes('10.') ||
        trimmed.includes('file://')
      ) {
        errors.push('CRITICAL: Localhost and private network targets are prohibited.');
      }
    }

    if (!config.objective || config.objective.trim().length < 10) {
      errors.push('Objective must be at least 10 characters describing the task.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  requiredPermissions(config: RepoLabSpec): JobPermissions {
    return {
      network: 'public_web_only',
      allowedHosts: ['github.com', 'api.github.com', 'registry.npmjs.org'],
      maxTokensEstimate: config.depth === 'deep' ? 80000 : 40000,
      timeoutMs: 300000,
      allowPublicWebOnly: true,
      disallowHostFilesystem: true,
      disallowDockerSocket: true,
      disallowPrivateNetwork: true
    };
  }

  requiredCapabilities(): Array<keyof ProviderCapabilities> {
    return ['executeJobs', 'remainingQuota'];
  }

  buildPlan(config: RepoLabSpec): JobPlan {
    return {
      steps: [
        {
          name: 'Accelerator & Skill Discovery (First Work)',
          type: 'discovery',
          description: 'Scout open-source repositories and agent skills to accelerate execution before writing code from scratch.'
        },
        {
          name: 'Sandbox Initialization',
          type: 'sandbox',
          description: 'Spin up disposable non-root container with network allowlist.'
        },
        {
          name: 'Clone Repository & Ingest Tools',
          type: 'sandbox',
          description: `Clone ${config.repoUrl} into isolated workspace alongside discovered skills.`
        },
        {
          name: 'AI Agent Evaluation & Execution',
          type: 'agent',
          description: `Execute task with discovered accelerators to address: "${config.objective}"`
        },
        {
          name: 'Static & Security Verification',
          type: 'verification',
          description: 'Scan generated changes and generate audit bundle.'
        }
      ]
    };
  }
}
