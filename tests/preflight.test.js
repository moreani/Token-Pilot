import test from 'node:test';
import assert from 'node:assert/strict';
import { RepoLabJobTemplate } from '../packages/jobs/dist/repoLab.js';
import { MockSandboxProvider } from '../packages/sandbox/dist/mockSandboxProvider.js';

test('Preflight & Safety: RepoLabJobTemplate rejects non-GitHub or malicious targets', () => {
  const template = new RepoLabJobTemplate();

  // Test 1: Localhost / SSRF attempt
  const ssrfResult = template.validate({
    repoUrl: 'http://localhost:8080/my-repo',
    objective: 'Test malicious SSRF vulnerability',
    depth: 'standard',
    runTests: false,
    generateFixes: false
  });
  assert.equal(ssrfResult.valid, false);
  assert.ok(ssrfResult.errors.some((e) => e.includes('Localhost and private network targets are prohibited')));

  // Test 2: Private IP attempt
  const privateIpResult = template.validate({
    repoUrl: 'http://192.168.1.100/repo.git',
    objective: 'Analyze internal repo from local network',
    depth: 'standard',
    runTests: false,
    generateFixes: false
  });
  assert.equal(privateIpResult.valid, false);

  // Test 3: Short objective
  const shortObjResult = template.validate({
    repoUrl: 'https://github.com/torvalds/linux',
    objective: 'short',
    depth: 'standard',
    runTests: false,
    generateFixes: false
  });
  assert.equal(shortObjResult.valid, false);
  assert.ok(shortObjResult.errors.some((e) => e.includes('at least 10 characters')));

  // Test 4: Valid public GitHub repo
  const validResult = template.validate({
    repoUrl: 'https://github.com/facebook/react',
    objective: 'Investigate build configuration and component structure',
    depth: 'standard',
    runTests: true,
    generateFixes: false
  });
  assert.equal(validResult.valid, true);
  assert.equal(validResult.errors.length, 0);
});

test('Sandbox Security: rejects attempts to mount host sensitive directories', async () => {
  const provider = new MockSandboxProvider();

  await assert.rejects(
    async () => {
      await provider.create({
        jobId: 'evil-job',
        image: 'tokenpilot/base-general',
        cpuLimit: 2,
        memoryMb: 2048,
        pidsLimit: 100,
        timeoutMs: 60000,
        networkPolicy: 'none',
        env: {},
        mounts: [
          {
            hostPath: '/Users/test/.ssh',
            containerPath: '/root/.ssh',
            readOnly: true,
            type: 'bind'
          }
        ]
      });
    },
    (err) => {
      return (
        err instanceof Error &&
        err.message.includes('SECURITY VIOLATION: Host sensitive directories cannot be mounted')
      );
    }
  );
});
