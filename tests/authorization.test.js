import test from 'node:test';
import assert from 'node:assert/strict';
import { createDatabase } from '../packages/core/dist/db/database.js';
import { TokenPilotService } from '../packages/core/dist/service/tokenPilotService.js';
import {
  canonicalJsonStringify,
  computeJobSpecHash,
  computePermissionsHash,
  verifyAuthorizationHashes
} from '../packages/core/dist/security/hashing.js';

test('Security Hashing: canonical JSON stringify is deterministic regardless of key order', () => {
  const obj1 = { b: 2, a: 1, c: { z: 26, y: 25 } };
  const obj2 = { c: { y: 25, z: 26 }, a: 1, b: 2 };

  const str1 = canonicalJsonStringify(obj1);
  const str2 = canonicalJsonStringify(obj2);

  assert.equal(str1, str2);
  assert.equal(computeJobSpecHash(obj1), computeJobSpecHash(obj2));
});

test('Authorization: explicit RUN JOB generates immutable ExecutionIntent', () => {
  const db = createDatabase(':memory:');
  const service = new TokenPilotService(db);

  // Setup job
  const job = service.createJob({
    type: 'repo_lab',
    name: 'Test Repo Lab',
    objective: 'Analyze and test public code safely',
    providerId: 'antigravity',
    accountId: 'antigravity-personal-3',
    spec: {
      repoUrl: 'https://github.com/example/sample-project',
      depth: 'standard',
      runTests: true,
      generateFixes: false
    }
  });

  assert.equal(job.state, 'DRAFT');

  // Preflight
  const preflight = service.runPreflight(job.id);
  assert.equal(preflight.ok, true);
  const awaitingJob = service.getJob(job.id);
  assert.equal(awaitingJob?.state, 'AWAITING_CONFIRMATION');

  // User authorizes via RUN JOB
  const intent = service.authorizeJob(job.id);
  assert.equal(intent.userConfirmed, true);
  assert.equal(intent.jobId, job.id);
  assert.ok(intent.jobSpecHash.length > 0);
  assert.ok(intent.permissionsHash.length > 0);

  const authorizedJob = service.getJob(job.id);
  assert.equal(authorizedJob?.state, 'AUTHORIZED');
  assert.ok(authorizedJob?.authorizedAt !== null);
});

test('Authorization: modifying job spec or permissions after authorization invalidates intent', () => {
  const db = createDatabase(':memory:');
  const service = new TokenPilotService(db);

  const job = service.createJob({
    type: 'repo_lab',
    name: 'Tamper Test',
    objective: 'Initial safe objective for testing',
    providerId: 'antigravity',
    accountId: 'antigravity-personal-3',
    spec: {
      repoUrl: 'https://github.com/example/repo',
      depth: 'shallow',
      runTests: false,
      generateFixes: false
    }
  });

  service.runPreflight(job.id);
  service.authorizeJob(job.id);

  // Assert authorized
  assert.equal(service.getJob(job.id)?.state, 'AUTHORIZED');
  assert.ok(service.getExecutionIntent(job.id) !== null);

  // Attempt to tamper with objective after authorization
  service.updateJob(job.id, {
    objective: 'Tampered malicious objective attempting unauthorized execution'
  });

  // Authorization must now be invalidated!
  const updatedJob = service.getJob(job.id);
  assert.equal(updatedJob?.state, 'AWAITING_CONFIRMATION');
  assert.equal(updatedJob?.authorizedAt, null);
  assert.equal(service.getExecutionIntent(job.id), null);

  // Audit event for invalidation must be logged
  const events = service.audit.getEvents({ jobId: job.id });
  const invalidationEvent = events.find((e) => e.type === 'AUTHORIZATION_INVALIDATED');
  assert.ok(invalidationEvent, 'Expected AUTHORIZATION_INVALIDATED audit event to be logged');
});
