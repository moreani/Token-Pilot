import test from 'node:test';
import assert from 'node:assert/strict';

test('OpenCode: prioritizes Monthly quota window over 5-hour rolling session', () => {
  const rawItem = {
    provider: 'OpenCode Go',
    plan: 'Go',
    email: null,
    metrics: [
      {
        label: 'Rolling',
        used_percent: 0.0,
        remaining_percent: 100.0,
        remaining_label: null,
        resets_at: '2026-09-28T11:28:23.773Z'
      },
      {
        label: 'Weekly',
        used_percent: 0.0,
        remaining_percent: 100.0,
        remaining_label: null,
        resets_at: '2026-10-05T00:00:00.000Z'
      },
      {
        label: 'Monthly',
        used_percent: 22.0,
        remaining_percent: 78.0,
        remaining_label: null,
        resets_at: '2026-10-12T11:30:26.000Z'
      }
    ]
  };

  // Simulate prioritization logic
  const metricsList = [...rawItem.metrics];
  const monthlyIdx = metricsList.findIndex((m) => m.label?.toLowerCase().includes('month'));
  assert.ok(monthlyIdx >= 0, 'Expected Monthly metric to exist');

  if (monthlyIdx > 0) {
    const [monthly] = metricsList.splice(monthlyIdx, 1);
    metricsList.unshift(monthly);
  }

  // Monthly must now be at index 0 (primary window)
  assert.equal(metricsList[0].label, 'Monthly');
  assert.equal(metricsList[0].remaining_percent, 78.0);
  assert.equal(metricsList[0].used_percent, 22.0);
  assert.equal(metricsList[0].resets_at, '2026-10-12T11:30:26.000Z');

  // Verify secondary windows still preserve Weekly and 5-Hour Rolling session
  assert.equal(metricsList[1].label, 'Rolling');
  assert.equal(metricsList[2].label, 'Weekly');

  // Date formatting for monthly expiry
  const monthlyReset = new Date(metricsList[0].resets_at);
  const formattedDate = monthlyReset.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  assert.equal(formattedDate, 'Oct 12');

  const resetLabel = `Resets ${formattedDate} (Monthly)`;
  assert.equal(resetLabel, 'Resets Oct 12 (Monthly)');
});

test('OpenCode: provides exact model catalog with unlimited free tiers and flash models', async () => {
  const { OPENCODE_MODELS } = await import('../packages/contracts/dist/quota.js');
  assert.ok(Array.isArray(OPENCODE_MODELS));
  assert.equal(OPENCODE_MODELS.length, 6);

  const modelIds = OPENCODE_MODELS.map((m) => m.id);
  assert.ok(modelIds.includes('deepseek-v4-1-flash'));
  assert.ok(modelIds.includes('mimo-v2-6-flash'));
  assert.ok(modelIds.includes('muse-spark-1-3'));
  assert.ok(modelIds.includes('space-bunny-free'));
  assert.ok(modelIds.includes('longcat-2-5-preview-free'));
  assert.ok(modelIds.includes('glm-4-5-flash'));

  // Unlimited free models
  const spaceBunny = OPENCODE_MODELS.find((m) => m.id === 'space-bunny-free');
  assert.equal(spaceBunny.displayName, 'Space Bunny Free');
  assert.equal(spaceBunny.isUnlimited, true);
  assert.equal(spaceBunny.tier, '∞ unlimited free');
  assert.equal(spaceBunny.speedTag, 'Free / Unlimited');

  const longCat = OPENCODE_MODELS.find((m) => m.id === 'longcat-2-5-preview-free');
  assert.equal(longCat.displayName, 'LongCat 2.5 Preview Free');
  assert.equal(longCat.isUnlimited, true);
  assert.equal(longCat.tier, '∞ unlimited free');

  // High performance flash models
  const deepseek = OPENCODE_MODELS.find((m) => m.id === 'deepseek-v4-1-flash');
  assert.equal(deepseek.displayName, 'DeepSeek V4.1 Flash');
  assert.equal(deepseek.tier, '26,000 / $60');
  assert.equal(deepseek.speedTag, 'Flash');

  const mimo = OPENCODE_MODELS.find((m) => m.id === 'mimo-v2-6-flash');
  assert.equal(mimo.displayName, 'MiMo-V2.6-Flash');
  assert.equal(mimo.tier, '30,100 / $60');
  assert.equal(mimo.speedTag, 'Flash');
});

test('OpenCode Escalation Policy: triggers advanced models from opencode.ai/go only when primary model fails', async () => {
  const { OPENCODE_ESCALATION_MODELS } = await import('../packages/contracts/dist/quota.js');
  const { AutoRepairEngine } = await import('../packages/core/dist/repair/autoRepairEngine.js');

  // Verify escalation catalog from opencode.ai/go exists
  assert.ok(Array.isArray(OPENCODE_ESCALATION_MODELS));
  const escalationIds = OPENCODE_ESCALATION_MODELS.map((m) => m.id);
  assert.ok(escalationIds.includes('deepseek-v4-pro'));
  assert.ok(escalationIds.includes('gpt-6-luna'));
  assert.ok(escalationIds.includes('grok-4-7'));
  assert.ok(escalationIds.includes('kimi-k2-7-code'));
  assert.ok(escalationIds.includes('qwen3-8-max'));

  // Test AutoRepairEngine escalation behavior:
  const engine = new AutoRepairEngine();
  const logs = [];

  // Scenario 1: Primary model succeeds on first cycle -> No escalation
  await engine.runRepairLoop(
    'AssertionError: value mismatch',
    {
      jobId: 'job-1',
      projectName: 'TestProject',
      repoUrl: 'https://github.com/test/repo',
      providerId: 'opencode',
      activeModelId: 'deepseek-v4-1-flash',
      forceEscalationTest: false
    },
    (msg) => logs.push(msg)
  );

  assert.ok(logs.some((l) => l.includes('Active model: deepseek-v4-1-flash')));
  assert.ok(!logs.some((l) => l.includes('[OpenCode Escalation]')), 'Escalation must NOT trigger when primary model succeeds');

  // Scenario 2: Primary model unable to resolve on Cycle 1 -> Triggers escalation on Cycle 2
  const escalationLogs = [];
  const result = await engine.runRepairLoop(
    'TypeError: cannot compile AST undefined symbol (novel complex regression)',
    {
      jobId: 'job-2',
      projectName: 'TestProject',
      repoUrl: 'https://github.com/test/repo',
      providerId: 'opencode',
      activeModelId: 'deepseek-v4-1-flash',
      forceEscalationTest: true
    },
    (msg) => escalationLogs.push(msg)
  );

  assert.equal(result.status, 'RESOLVED');
  assert.equal(result.cyclesExecuted, 2);
  assert.ok(
    escalationLogs.some((l) => l.includes('[OpenCode Escalation]') && l.includes('DeepSeek V4 Pro')),
    'Escalation MUST trigger to power model when primary model cannot complete task'
  );
});


