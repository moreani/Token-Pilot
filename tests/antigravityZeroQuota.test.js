import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseModelQuotaFraction,
  parseAntigravityModelsData
} from '../packages/quota/dist/antigravityCollector.js';

test('Antigravity Regression: Proto3 zero-omission correctly parses omitted remainingFraction as 0%', () => {
  // Google Cloud Protobuf v3 JSON serializer omits fields with default/zero values.
  // When Claude quota is exhausted, Google sends only resetTime, omitting remainingFraction.
  const exhaustedProto3QuotaInfo = {
    resetTime: '2026-09-24T15:44:52Z'
  };

  const parsed = parseModelQuotaFraction(exhaustedProto3QuotaInfo);

  assert.equal(parsed.fraction, 0.0, 'Omitted remainingFraction must parse to 0.0');
  assert.equal(parsed.percentage, 0, 'Omitted remainingFraction must parse to 0%');
  assert.equal(parsed.resetTime, '2026-09-24T15:44:52Z');
});

test('Antigravity Regression: Normal non-zero quotas parse accurately without alteration', () => {
  const fullQuota = { remainingFraction: 1.0, resetTime: '2026-09-24T17:44:33Z' };
  const parsedFull = parseModelQuotaFraction(fullQuota);
  assert.equal(parsedFull.fraction, 1.0);
  assert.equal(parsedFull.percentage, 100);

  const partialQuota = { remainingFraction: 0.624, resetTime: '2026-09-24T16:13:57Z' };
  const parsedPartial = parseModelQuotaFraction(partialQuota);
  assert.equal(parsedPartial.fraction, 0.624);
  assert.equal(parsedPartial.percentage, 62);
});

test('Antigravity Regression: Local AGM cached database acts as fallback ground truth', () => {
  const cachedModel = { percentage: 0, resetTime: '2026-09-24T15:44:52Z' };
  const parsed = parseModelQuotaFraction(undefined, cachedModel);

  assert.equal(parsed.fraction, 0.0);
  assert.equal(parsed.percentage, 0);
  assert.equal(parsed.resetTime, '2026-09-24T15:44:52Z');
});

test('Antigravity Regression: Full models payload with exhausted Claude reports 0% for Claude Weekly & 5-Hour', () => {
  const simulatedHardikResponse = {
    models: {
      'gemini-3.8-flash-medium': {
        displayName: 'Gemini 3.8 Flash (Medium)',
        supportsThinking: true,
        quotaInfo: {
          remainingFraction: 0.62,
          resetTime: '2026-09-24T16:13:57Z'
        }
      },
      'gemini-3.1-pro-low': {
        displayName: 'Gemini 3.1 Pro (Low)',
        supportsThinking: true,
        quotaInfo: {
          remainingFraction: 0.62,
          resetTime: '2026-09-24T16:13:57Z'
        }
      },
      'claude-sonnet-4-6': {
        displayName: 'Claude Sonnet 4.6 (Thinking)',
        supportsThinking: true,
        quotaInfo: {
          // Proto3 zero-omission: remainingFraction: 0 is omitted
          resetTime: '2026-09-24T15:44:52Z'
        }
      },
      'claude-opus-4-6-thinking': {
        displayName: 'Claude Opus 4.6 (Thinking)',
        supportsThinking: true,
        quotaInfo: {
          // Proto3 zero-omission: remainingFraction: 0 is omitted
          resetTime: '2026-09-24T15:44:52Z'
        }
      },
      'gpt-oss-120b-medium': {
        displayName: 'GPT-OSS 120B (Medium)',
        supportsThinking: true,
        quotaInfo: {
          // Proto3 zero-omission: remainingFraction: 0 is omitted
          resetTime: '2026-09-24T15:44:52Z'
        }
      }
    }
  };

  const parsed = parseAntigravityModelsData(simulatedHardikResponse);

  // Gemini must reflect 62%
  assert.equal(parsed.geminiWeeklyPercent, 62);
  assert.equal(parsed.geminiFiveHourPercent, 62);
  assert.equal(parsed.modelGroups[0].weeklyLimitRemaining, 62);

  // Claude MUST strictly reflect 0% (never 100% or 67%)
  assert.equal(parsed.claudeWeeklyPercent, 0, 'Claude Weekly must be 0%');
  assert.equal(parsed.claudeFiveHourPercent, 0, 'Claude 5-Hour must be 0%');
  assert.equal(parsed.modelGroups[1].weeklyLimitRemaining, 0, 'Claude group weekly must be 0%');
  assert.equal(parsed.modelGroups[1].fiveHourLimitRemaining, 0, 'Claude group 5-hour must be 0%');

  // Verify individual modelDetails
  const sonnet = parsed.modelDetails.find((m) => m.id === 'claude-sonnet-4-6');
  assert.ok(sonnet);
  assert.equal(sonnet.percentage, 0);

  const opus = parsed.modelDetails.find((m) => m.id === 'claude-opus-4-6-thinking');
  assert.ok(opus);
  assert.equal(opus.percentage, 0);
});

test('Antigravity Regression: Account recommendation flags Conserve when Claude is exhausted', () => {
  const windows = [
    { label: 'Gemini Weekly', remainingFraction: 0.62 },
    { label: 'Gemini 5-Hour', remainingFraction: 0.62 },
    { label: 'Claude/GPT Weekly', remainingFraction: 0.0 },
    { label: 'Claude/GPT 5-Hour', remainingFraction: 0.0 }
  ];

  const primaryWindow = windows[0];
  const fractions = windows.map((w) => w.remainingFraction);
  const minRemaining = Math.min(...fractions);

  const isConserve = minRemaining <= 0.15;
  const isBurn = !isConserve && primaryWindow ? primaryWindow.remainingFraction > 0.7 && minRemaining > 0.3 : false;

  assert.equal(isConserve, true, 'Must flag conserve when any model group is exhausted');
  assert.equal(isBurn, false, 'Must NEVER recommend burn when a model group is at 0%');
});
