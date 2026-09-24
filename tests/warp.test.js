import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchWarpAccountsQuota, getWarpDatabasePath } from '../packages/quota/dist/warpCollector.js';

test('Warp: collector safely discovers local database and extracts account quota', () => {
  const dbPath = getWarpDatabasePath();
  // On this developer machine, Warp is installed
  if (dbPath) {
    const accounts = fetchWarpAccountsQuota();
    assert.ok(Array.isArray(accounts));
    assert.ok(accounts.length > 0, 'Expected at least 1 Warp account');

    const warpAcc = accounts[0];
    assert.ok(warpAcc.email.includes('@'), 'Expected valid email');
    assert.ok(warpAcc.name.length > 0, 'Expected valid display name');
    assert.ok(warpAcc.limit >= 100, 'Expected limit >= 100');
    assert.equal(warpAcc.used, 0);
    assert.equal(warpAcc.remaining, warpAcc.limit);
    assert.ok(warpAcc.plan.length > 0, 'Expected plan name');
    assert.ok(warpAcc.features, 'Expected feature flags');
    assert.equal(typeof warpAcc.features.codeSuggestions, 'boolean');
  } else {
    // Graceful fallback if Warp is not installed
    const accounts = fetchWarpAccountsQuota();
    assert.deepEqual(accounts, []);
  }
});
