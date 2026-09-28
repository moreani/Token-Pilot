import type { Job, JobResult } from '@tokenpilot/contracts';

/**
 * Standard Model Context Protocol (MCP) tool definitions exposed to Antigravity,
 * Claude Code, and other AI coding agents.
 */
export const TOKENPILOT_MCP_TOOLS = [
  {
    name: 'tokenpilot_get_context',
    description: 'Retrieve the target repository, architectural AST summary, objective, and security boundaries for this job.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string', description: 'The unique identifier for the authorized job' }
      },
      required: ['jobId']
    }
  },
  {
    name: 'tokenpilot_report_progress',
    description: 'Report execution progress, active milestones, and real-time logs back to the TokenPilot command center.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        stage: {
          type: 'string',
          enum: ['discovery', 'ast_analysis', 'synthesizing_tests', 'security_scan', 'verifying', 'finalizing']
        },
        percent: { type: 'number', minimum: 0, maximum: 100 },
        message: { type: 'string' }
      },
      required: ['jobId', 'stage', 'percent', 'message']
    }
  },
  {
    name: 'tokenpilot_submit_diff',
    description: 'Submit the completed git unified diff patch, test assertions generated, and execution findings to TokenPilot.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: { type: 'string' },
        summary: { type: 'string', description: 'Executive summary of findings, fixes, and generated tests' },
        filesChanged: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of files modified or added'
        },
        patch: { type: 'string', description: 'Standard git unified diff formatted patch' },
        metrics: {
          type: 'object',
          properties: {
            testsGenerated: { type: 'number' },
            testsPassed: { type: 'number' },
            cvesRemediated: { type: 'number' },
            tokensSaved: { type: 'number' }
          }
        }
      },
      required: ['jobId', 'summary', 'filesChanged', 'patch']
    }
  }
];

export interface McpCallProgressArgs {
  jobId: string;
  stage: string;
  percent: number;
  message: string;
}

export interface McpCallSubmitDiffArgs {
  jobId: string;
  summary: string;
  filesChanged: string[];
  patch: string;
  metrics?: {
    testsGenerated?: number;
    testsPassed?: number;
    cvesRemediated?: number;
    tokensSaved?: number;
  };
}

/**
 * Generates an MCP server configuration JSON object suitable for passing to
 * Antigravity CLI (`agy --mcp-config ...`) or Claude Code.
 */
export function generateMcpServerConfig(bridgeServerPath: string, port = 5174) {
  return {
    mcpServers: {
      tokenpilot: {
        command: 'node',
        args: [bridgeServerPath, '--port', String(port)],
        env: {
          TOKENPILOT_MCP_MODE: 'sidecar'
        }
      }
    }
  };
}

/**
 * In-memory MCP Job Bridge that handles tool execution events
 * between TokenPilot and AI agent runners.
 */
export class McpJobBridge {
  private activeJobs = new Map<string, {
    job: Job;
    onLog: (msg: string) => void;
    onProgress?: (percent: number, stage: string) => void;
    diffResult?: McpCallSubmitDiffArgs;
  }>();

  registerJob(
    job: Job,
    onLog: (msg: string) => void,
    onProgress?: (percent: number, stage: string) => void
  ) {
    this.activeJobs.set(job.id, { job, onLog, onProgress });
  }

  handleToolCall(name: string, args: Record<string, any>): { content: Array<{ type: 'text'; text: string }>; isError?: boolean } {
    if (name === 'tokenpilot_get_context') {
      const entry = this.activeJobs.get(args.jobId);
      if (!entry) {
        return { isError: true, content: [{ type: 'text', text: `Job not found: ${args.jobId}` }] };
      }
      const { job } = entry;
      const context = {
        jobId: job.id,
        name: job.name,
        objective: job.objective,
        repoUrl: (job.spec as any).repoUrl || 'https://github.com/facebook/react',
        depth: (job.spec as any).depth || 'standard',
        runTests: (job.spec as any).runTests ?? true,
        permissions: job.permissions
      };
      return { content: [{ type: 'text', text: JSON.stringify(context, null, 2) }] };
    }

    if (name === 'tokenpilot_report_progress') {
      const entry = this.activeJobs.get(args.jobId);
      if (!entry) {
        return { isError: true, content: [{ type: 'text', text: `Job not found: ${args.jobId}` }] };
      }
      const { percent, stage, message } = args as McpCallProgressArgs;
      entry.onLog(`[MCP Agent] (${percent}%) [${stage}] ${message}`);
      if (entry.onProgress) {
        entry.onProgress(percent, stage);
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, acknowledged: true }) }] };
    }

    if (name === 'tokenpilot_submit_diff') {
      const entry = this.activeJobs.get(args.jobId);
      if (!entry) {
        return { isError: true, content: [{ type: 'text', text: `Job not found: ${args.jobId}` }] };
      }
      const submitArgs = args as McpCallSubmitDiffArgs;
      entry.diffResult = submitArgs;
      entry.onLog(`[MCP Agent] 📝 Unified diff patch received: ${submitArgs.filesChanged.length} files modified.`);
      if (submitArgs.metrics?.testsGenerated) {
        entry.onLog(`[MCP Agent] 🧪 Tests generated: ${submitArgs.metrics.testsGenerated} passed.`);
      }
      return { content: [{ type: 'text', text: JSON.stringify({ ok: true, patchStored: true }) }] };
    }

    return { isError: true, content: [{ type: 'text', text: `Unknown MCP tool: ${name}` }] };
  }

  getJobResultDiff(jobId: string): McpCallSubmitDiffArgs | undefined {
    return this.activeJobs.get(jobId)?.diffResult;
  }
}
