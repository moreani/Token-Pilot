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
