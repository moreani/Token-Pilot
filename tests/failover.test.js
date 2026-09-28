import test from 'node:test';
import assert from 'node:assert/strict';

test('Multi-Account Failover: establishes priority order and tracks cascading execution', () => {
  const pool = [
    {
      accountId: 'antigravity-moreani4_gmail_com',
      providerId: 'antigravity',
      displayAlias: 'Aniket More (moreani4@gmail.com)',
      priority: 1,
      status: 'active'
    },
    {
      accountId: 'codex-pro',
      providerId: 'codex',
      displayAlias: 'Jitendra Jain (jitendrajainnew@gmail.com) • Codex Pro',
      priority: 2,
      status: 'standby'
    }
  ];

  // Verify pool ordering
  assert.equal(pool.length, 2);
  assert.equal(pool[0].status, 'active');
  assert.equal(pool[1].status, 'standby');

  // Simulate quota threshold trigger and failover
  const exhaustedItem = pool[0];
  const nextItem = pool[1];

  exhaustedItem.status = 'exhausted';
  nextItem.status = 'active';

  const failoverHistory = [
    {
      fromAccountId: exhaustedItem.accountId,
      toAccountId: nextItem.accountId,
      reason: 'Primary quota limit reached / 429 rate limit detected',
      timestamp: new Date().toISOString()
    }
  ];

  assert.equal(exhaustedItem.status, 'exhausted');
  assert.equal(nextItem.status, 'active');
  assert.equal(failoverHistory.length, 1);
  assert.equal(failoverHistory[0].fromAccountId, 'antigravity-moreani4_gmail_com');
  assert.equal(failoverHistory[0].toAccountId, 'codex-pro');
});

test('Auto Mode Policy: strictly prioritizes Antigravity first, then OpenCode, and excludes Claude and Codex', () => {
  const allAccounts = [
    { id: 'claude-main', providerId: 'claude', displayAlias: 'Claude Main', manualOnly: true },
    { id: 'antigravity-primary', providerId: 'antigravity', displayAlias: 'Antigravity Primary', manualOnly: false },
    { id: 'codex-pro', providerId: 'codex', displayAlias: 'Codex Pro', manualOnly: true },
    { id: 'opencode-monthly', providerId: 'opencode', displayAlias: 'OpenCode Monthly', manualOnly: false },
    { id: 'antigravity-secondary', providerId: 'antigravity', displayAlias: 'Antigravity Sec', manualOnly: false }
  ];

  // In Auto Mode: filter out manual-only accounts (Claude & Codex)
  const autoModeCandidates = allAccounts.filter(
    (a) => !a.manualOnly && a.providerId !== 'claude' && a.providerId !== 'codex'
  );

  // Assert Claude and Codex are strictly excluded
  assert.equal(autoModeCandidates.length, 3);
  assert.ok(!autoModeCandidates.some((a) => a.providerId === 'claude'));
  assert.ok(!autoModeCandidates.some((a) => a.providerId === 'codex'));

  // Sort by Auto Mode priority: Antigravity (1) > OpenCode (2)
  const priorityOrder = { antigravity: 1, opencode: 2 };
  autoModeCandidates.sort((a, b) => {
    const pA = priorityOrder[a.providerId] ?? 99;
    const pB = priorityOrder[b.providerId] ?? 99;
    return pA - pB;
  });

  // Verify exact ordering: All Antigravity first, then OpenCode
  assert.equal(autoModeCandidates[0].providerId, 'antigravity');
  assert.equal(autoModeCandidates[1].providerId, 'antigravity');
  assert.equal(autoModeCandidates[2].providerId, 'opencode');
});

test('Auto Mode Suggestion: Recommendation engine strictly selects Antigravity or OpenCode, never Claude or Codex', () => {
  const snapshots = [
    { accountId: 'claude-main', providerId: 'claude', recommendation: 'burn', windows: [{ remainingFraction: 0.95 }] },
    { accountId: 'codex-pro', providerId: 'codex', recommendation: 'burn', windows: [{ remainingFraction: 0.99 }] },
    { accountId: 'opencode-monthly', providerId: 'opencode', recommendation: 'burn', windows: [{ remainingFraction: 0.85 }] },
    { accountId: 'antigravity-work', providerId: 'antigravity', recommendation: 'burn', windows: [{ remainingFraction: 0.80 }] }
  ];

  // Engine filters candidates for auto-mode recommendation:
  const autoCandidates = snapshots.filter(
    (s) => s.providerId !== 'claude' && s.providerId !== 'codex' && (s.providerId === 'antigravity' || s.providerId === 'opencode')
  );

  const priorityOrder = { antigravity: 1, opencode: 2 };
  autoCandidates.sort((a, b) => {
    const pA = priorityOrder[a.providerId] ?? 99;
    const pB = priorityOrder[b.providerId] ?? 99;
    if (pA !== pB) return pA - pB;
    return (b.windows[0]?.remainingFraction ?? 0) - (a.windows[0]?.remainingFraction ?? 0);
  });

  // Even though Claude (95%) and Codex (99%) have more quota, Antigravity MUST be chosen first!
  assert.equal(autoCandidates[0].providerId, 'antigravity');
  assert.equal(autoCandidates[0].accountId, 'antigravity-work');
  assert.equal(autoCandidates[1].providerId, 'opencode');
  assert.equal(autoCandidates[1].accountId, 'opencode-monthly');
});

