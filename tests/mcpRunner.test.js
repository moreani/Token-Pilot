import test from 'node:test';
import assert from 'node:assert/strict';
import {
  TOKENPILOT_MCP_TOOLS,
  generateMcpServerConfig,
  McpJobBridge
} from '../packages/jobs/dist/index.js';

test('MCP Runner: exposes standard tools schema for Antigravity and AI agents', () => {
  assert.equal(Array.isArray(TOKENPILOT_MCP_TOOLS), true);
  const toolNames = TOKENPILOT_MCP_TOOLS.map((t) => t.name);
  assert.ok(toolNames.includes('tokenpilot_get_context'));
  assert.ok(toolNames.includes('tokenpilot_report_progress'));
  assert.ok(toolNames.includes('tokenpilot_submit_diff'));
});

test('MCP Runner: generates standard server config for agent CLI invocations', () => {
  const config = generateMcpServerConfig('/path/to/sidecar.js', 5174);
  assert.ok(config.mcpServers.tokenpilot);
  assert.equal(config.mcpServers.tokenpilot.command, 'node');
  assert.deepEqual(config.mcpServers.tokenpilot.args, ['/path/to/sidecar.js', '--port', '5174']);
  assert.equal(config.mcpServers.tokenpilot.env.TOKENPILOT_MCP_MODE, 'sidecar');
});

test('MCP Runner: McpJobBridge handles context querying, progress reporting, and patch submission', () => {
  const bridge = new McpJobBridge();
  const logs = [];
  const progressEvents = [];

  const mockJob = {
    id: 'job-test-101',
    name: 'Autonomous Test Suite Booster',
    objective: 'Generate deterministic tests for uncovered auth functions',
    state: 'RUNNING',
    spec: {
      repoUrl: 'https://github.com/facebook/react',
      depth: 'standard',
      runTests: true
    },
    permissions: {
      network: 'public_web_only',
      allowedHosts: ['github.com']
    }
  };

  bridge.registerJob(
    mockJob,
    (msg) => logs.push(msg),
    (pct, stage) => progressEvents.push({ pct, stage })
  );

  // 1. Tool Call: tokenpilot_get_context
  const ctxResult = bridge.handleToolCall('tokenpilot_get_context', { jobId: 'job-test-101' });
  assert.equal(ctxResult.isError, undefined);
  const parsedCtx = JSON.parse(ctxResult.content[0].text);
  assert.equal(parsedCtx.jobId, 'job-test-101');
  assert.equal(parsedCtx.repoUrl, 'https://github.com/facebook/react');
  assert.equal(parsedCtx.depth, 'standard');

  // 2. Tool Call: tokenpilot_report_progress
  const progResult = bridge.handleToolCall('tokenpilot_report_progress', {
    jobId: 'job-test-101',
    stage: 'synthesizing_tests',
    percent: 65,
    message: 'Generated 14 test cases for auth modules'
  });
  assert.equal(progResult.isError, undefined);
  assert.equal(progressEvents.length, 1);
  assert.equal(progressEvents[0].pct, 65);
  assert.equal(progressEvents[0].stage, 'synthesizing_tests');
  assert.ok(logs[0].includes('(65%) [synthesizing_tests] Generated 14 test cases'));

  // 3. Tool Call: tokenpilot_submit_diff
  const mockPatch = `--- a/tests/auth.test.ts\n+++ b/tests/auth.test.ts\n@@ -0,0 +1,15 @@\n+describe('Auth', () => {\n+  it('should authenticate', () => {\n+    expect(true).toBe(true);\n+  });\n+});`;

  const submitResult = bridge.handleToolCall('tokenpilot_submit_diff', {
    jobId: 'job-test-101',
    summary: 'Generated 14 unit test assertions covering edge cases',
    filesChanged: ['tests/auth.test.ts'],
    patch: mockPatch,
    metrics: {
      testsGenerated: 14,
      testsPassed: 14,
      tokensSaved: 18500
    }
  });
  assert.equal(submitResult.isError, undefined);
  const storedDiff = bridge.getJobResultDiff('job-test-101');
  assert.ok(storedDiff);
  assert.equal(storedDiff.filesChanged[0], 'tests/auth.test.ts');
  assert.equal(storedDiff.metrics.testsGenerated, 14);
  assert.equal(storedDiff.patch, mockPatch);

  // 4. Unknown tool error handling
  const unknownResult = bridge.handleToolCall('unknown_tool', { jobId: 'job-test-101' });
  assert.equal(unknownResult.isError, true);
});
