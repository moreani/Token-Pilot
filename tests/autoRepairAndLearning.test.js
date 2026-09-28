import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AutoUpdater,
  ExperienceMemoryStore,
  AutoRepairEngine
} from '../packages/core/dist/index.js';

test('Auto-Updater: checks component status and applies updates cleanly', async () => {
  const updater = new AutoUpdater();
  const check = await updater.checkForUpdates();

  assert.equal(typeof check.checkedAt, 'string');
  assert.ok(check.components.length >= 4);
  assert.equal(check.systemStatus, 'updates-available');
  assert.ok(check.totalUpdatesAvailable >= 1);

  // Verify component details
  const engineComp = check.components.find((c) => c.component === 'engine');
  assert.ok(engineComp);
  assert.equal(engineComp.hasUpdate, true);
  assert.equal(engineComp.latestVersion, '1.2.4');

  // Apply updates
  const applyRes = await updater.applyUpdates(['engine', 'skills']);
  assert.equal(applyRes.success, true);
  assert.equal(applyRes.updatedComponents.length, 2);

  // Check post-update status
  const postCheck = updater.getLastCheckResult();
  const updatedEngine = postCheck.components.find((c) => c.component === 'engine');
  assert.equal(updatedEngine.hasUpdate, false);
  assert.equal(updatedEngine.currentVersion, '1.2.4');
});

test('Experience Memory: finds existing pattern and serves zero-token patch', () => {
  const store = new ExperienceMemoryStore();

  // Test lookup for TypeScript compiler error
  const tsError = "error TS2304: Cannot find name 'AccountConfig' at line 42";
  const solution = store.findSolution(tsError);

  assert.ok(solution);
  assert.equal(solution.fingerprint.category, 'BUILD');
  assert.ok(solution.confidenceScore >= 0.9);
  assert.ok(solution.patchTemplate.includes('FallbackType'));

  // Test lookup for Playwright locator timeout
  const timeoutError = "locator.click: Timeout 30000ms exceeded waiting for selector";
  const timeoutSolution = store.findSolution(timeoutError);

  assert.ok(timeoutSolution);
  assert.equal(timeoutSolution.fingerprint.category, 'TEST');
  assert.ok(timeoutSolution.patchTemplate.includes('waitFor'));
});

test('Experience Memory: learns new patterns and gets smarter as used', () => {
  const store = new ExperienceMemoryStore();
  const initialStats = store.getStats();

  const novelError = "ReferenceError: Buffer is not defined in edge runtime";
  const solutionPatch = "import { Buffer } from 'node:buffer';";
  const explanation = "Import Buffer explicitly from node:buffer for edge compatibility";

  // 1. Record new solution
  const learned = store.recordSolution(
    'RUNTIME',
    novelError,
    solutionPatch,
    explanation,
    16000
  );

  assert.ok(learned.id.startsWith('mem-'));
  assert.equal(learned.successCount, 1);
  assert.equal(learned.confidenceScore, 0.88);

  const statsAfterLearn = store.getStats();
  assert.equal(statsAfterLearn.totalPatternsLearned, initialStats.totalPatternsLearned + 1);

  // 2. Query the newly learned solution
  const matched = store.findSolution("ReferenceError: Buffer is not defined in edge runtime at worker.js");
  assert.ok(matched);
  assert.equal(matched.id, learned.id);
  assert.equal(matched.patchTemplate, solutionPatch);

  // 3. Reinforce ("Becomes smarter as we use it more")
  const initialConfidence = matched.confidenceScore;
  store.reinforceSolution(matched.id, 15000);

  const reinforced = store.findSolution("ReferenceError: Buffer is not defined");
  assert.ok(reinforced.confidenceScore > initialConfidence);
  assert.equal(reinforced.successCount, 2);
  assert.equal(reinforced.tokensSavedTotal, 31000);
});

test('Auto-Repair Engine: classifies errors into PRD Section 49 categories', () => {
  const engine = new AutoRepairEngine();

  assert.equal(engine.classifyError('Missing executable at /Caches/ms-playwright'), 'ENVIRONMENT');
  assert.equal(engine.classifyError('SyntaxError: Unexpected token or TS2304'), 'BUILD');
  assert.equal(engine.classifyError('AssertionError: expected true but got false'), 'TEST');
  assert.equal(engine.classifyError('RangeError: Maximum call stack size exceeded'), 'LOGIC');
  assert.equal(engine.classifyError('HTTP 429: Rate limit quota window reached'), 'EXTERNAL');
  assert.equal(engine.classifyError('CVE-2026-9912 vulnerability detected'), 'SECURITY');
});

test('Auto-Repair Engine: bounded 5-cycle loop auto-heals and commits to memory bank', async () => {
  const engine = new AutoRepairEngine();
  const novelFlaw = "CompilerWarning: Unhandled edge branch in payment gateway fallback handler";

  const result = await engine.runRepairLoop(novelFlaw, {
    jobId: 'test-job-heal',
    projectName: 'Auto-Healing Test',
    repoUrl: 'github.com/test/repo'
  });

  assert.equal(result.status, 'RESOLVED');
  assert.ok(result.cyclesExecuted >= 1 && result.cyclesExecuted <= 5);
  assert.ok(result.history.length >= 1);
  assert.equal(result.history[0].testPassed, true);
  assert.ok(result.tokensSavedTotal > 0);
  assert.ok(result.learnedPatternId);

  // Subsequent call on the same error should now be resolved instantly via memory (0 LLM tokens burned)
  const memoryResult = await engine.runRepairLoop(novelFlaw, {
    jobId: 'test-job-heal-2',
    projectName: 'Auto-Healing Memory Test',
    repoUrl: 'github.com/test/repo'
  });

  assert.equal(memoryResult.status, 'RESOLVED');
  assert.equal(memoryResult.resolvedViaMemory, true);
  assert.equal(memoryResult.tokensBurnedTotal, 0); // Zero tokens burned!
  assert.equal(memoryResult.cyclesExecuted, 1);
});
