import test from 'node:test';
import assert from 'node:assert/strict';
import { MockQuotaSource } from '../packages/quota/dist/mockQuotaSource.js';
import { calculateFreshness } from '../packages/quota/dist/freshness.js';

test('Quota: MockQuotaSource returns multi-account snapshots across providers', async () => {
  const source = new MockQuotaSource();
  const snapshots = await source.snapshot();

  assert.ok(snapshots.length >= 5);

  const antigravity = snapshots.filter((s) => s.providerId === 'antigravity');
  assert.equal(antigravity.length, 3, 'Expected 3 Antigravity accounts (Personal 1, 2, 3)');

  const claude = snapshots.filter((s) => s.providerId === 'claude');
  assert.equal(claude.length, 2, 'Expected 2 Claude accounts (Main, Secondary)');

  const codex = snapshots.find((s) => s.providerId === 'codex');
  assert.ok(codex, 'Expected Codex account');

  const cursor = snapshots.find((s) => s.providerId === 'cursor');
  assert.ok(cursor, 'Expected Cursor account');
});

test('Quota: Freshness calculation matches PRD thresholds', () => {
  const now = new Date('2026-09-23T12:00:00Z');

  // 5 minutes ago -> fresh
  const fiveMinAgo = new Date('2026-09-23T11:55:00Z').toISOString();
  assert.equal(calculateFreshness(fiveMinAgo, now), 'fresh');

  // 30 minutes ago -> stale
  const thirtyMinAgo = new Date('2026-09-23T11:30:00Z').toISOString();
  assert.equal(calculateFreshness(thirtyMinAgo, now), 'stale');

  // 3 hours ago -> too_stale
  const threeHoursAgo = new Date('2026-09-23T09:00:00Z').toISOString();
  assert.equal(calculateFreshness(threeHoursAgo, now), 'too_stale');
});

test('Quota: Suggestion correctly highlights behind-pace account for productive burn', async () => {
  const source = new MockQuotaSource();
  const suggestion = await source.suggestion();

  assert.ok(suggestion !== null);
  assert.equal(suggestion?.recommendedAccountId, 'antigravity-personal-3');
  assert.equal(suggestion?.recommendation, 'burn');
  assert.equal(suggestion?.remainingFraction, 0.78);
  assert.equal(suggestion?.resetsInHours, 18);
  assert.equal(suggestion?.suggestedJobType, 'repo_lab');
});
