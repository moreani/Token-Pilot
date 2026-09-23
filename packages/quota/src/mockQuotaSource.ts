import type {
  Account,
  AccountQuotaSnapshot,
  QuotaSuggestion
} from '@tokenpilot/contracts';
import type { QuotaDoctorResult, QuotaSource } from './quotaSource.js';
import { calculateFreshness } from './freshness.js';

export class MockQuotaSource implements QuotaSource {
  public defaultAccounts: Account[] = [
    {
      id: 'antigravity-personal-1',
      providerId: 'antigravity',
      displayAlias: 'Antigravity — Personal 1',
      upstreamIdentities: ['user1@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: false,
        cli: true,
        supportsPaidOverageDetection: false
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'antigravity-personal-2',
      providerId: 'antigravity',
      displayAlias: 'Antigravity — Personal 2',
      upstreamIdentities: ['user2@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: false,
        cli: true,
        supportsPaidOverageDetection: false
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'antigravity-personal-3',
      providerId: 'antigravity',
      displayAlias: 'Antigravity — Personal 3',
      upstreamIdentities: ['work-dev@company.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: false,
        cli: true,
        supportsPaidOverageDetection: false
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'claude-main',
      providerId: 'claude',
      displayAlias: 'Claude — Main',
      upstreamIdentities: ['anthropic-main@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: true,
        cli: true,
        supportsPaidOverageDetection: true
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'claude-secondary',
      providerId: 'claude',
      displayAlias: 'Claude — Secondary',
      upstreamIdentities: ['anthropic-sec@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: true,
        cli: true,
        supportsPaidOverageDetection: true
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'codex-pro',
      providerId: 'codex',
      displayAlias: 'Codex — Pro',
      upstreamIdentities: ['openai-pro@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: true,
        executeJobs: true,
        switchAccount: true,
        directApi: true,
        cli: true,
        supportsPaidOverageDetection: true
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    },
    {
      id: 'cursor-pro',
      providerId: 'cursor',
      displayAlias: 'Cursor — Pro',
      upstreamIdentities: ['cursor-dev@gmail.com'],
      capabilities: {
        trackUsage: true,
        remainingQuota: true,
        resetTime: false,
        executeJobs: false, // PRD specifies Cursor initially monitor-only
        switchAccount: false,
        directApi: false,
        cli: false,
        supportsPaidOverageDetection: false
      },
      authStatus: 'ready',
      lastSeenAt: new Date().toISOString(),
      enabled: true
    }
  ];

  async doctor(): Promise<QuotaDoctorResult> {
    return {
      source: 'mock',
      available: true,
      version: '1.0.0-mock',
      details: 'Mock QuotaSource running with high-fidelity multi-account fixtures'
    };
  }

  async snapshot(): Promise<AccountQuotaSnapshot[]> {
    const now = new Date();
    const nowIso = now.toISOString();

    const inHours = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();

    return [
      {
        accountId: 'antigravity-personal-3',
        providerId: 'antigravity',
        windows: [
          {
            id: 'ag-window-p3-weekly',
            label: 'Weekly Pool',
            usedFraction: 0.22,
            remainingFraction: 0.78,
            resetsAt: inHours(18),
            observedAt: nowIso,
            source: 'aiuse-mock'
          },
          {
            id: 'ag-window-p3-session',
            label: '5-Hour Burst',
            usedFraction: 0.1,
            remainingFraction: 0.9,
            resetsAt: inHours(4),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'burn',
        recommendationReason: 'You are behind pace for this quota window. Resets in 18h with 78% remaining.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'antigravity-personal-1',
        providerId: 'antigravity',
        windows: [
          {
            id: 'ag-window-p1',
            label: 'Weekly Allowance',
            usedFraction: 0.55,
            remainingFraction: 0.45,
            resetsAt: inHours(72),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'on_pace',
        recommendationReason: 'Usage is on target relative to reset time.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'antigravity-personal-2',
        providerId: 'antigravity',
        windows: [
          {
            id: 'ag-window-p2',
            label: 'Weekly Allowance',
            usedFraction: 0.88,
            remainingFraction: 0.12,
            resetsAt: inHours(12),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'conserve',
        recommendationReason: 'Near quota limit, conserve remaining tokens.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'claude-secondary',
        providerId: 'claude',
        windows: [
          {
            id: 'claude-window-sec',
            label: 'Monthly Allowance',
            usedFraction: 0.12,
            remainingFraction: 0.88,
            resetsAt: inHours(24),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'burn',
        recommendationReason: '88% remaining quota resets in 24 hours.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'claude-main',
        providerId: 'claude',
        windows: [
          {
            id: 'claude-window-main',
            label: '5-Hour Window',
            usedFraction: 0.45,
            remainingFraction: 0.55,
            resetsAt: inHours(3),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'on_pace',
        recommendationReason: 'Pace is balanced.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'codex-pro',
        providerId: 'codex',
        windows: [
          {
            id: 'codex-window-pro',
            label: 'Monthly Quota',
            usedFraction: 0.4,
            remainingFraction: 0.6,
            resetsAt: inHours(96),
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'on_pace',
        recommendationReason: 'On pace with standard consumption.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      },
      {
        accountId: 'cursor-pro',
        providerId: 'cursor',
        windows: [
          {
            id: 'cursor-window-pro',
            label: 'Fast Requests Pool',
            usedFraction: 0.7,
            remainingFraction: 0.3,
            resetsAt: null,
            observedAt: nowIso,
            source: 'aiuse-mock'
          }
        ],
        recommendation: 'on_pace',
        recommendationReason: 'Monitor-only mode.',
        freshness: calculateFreshness(nowIso, now),
        rawSourceVersion: 'aiuse-0.9.4',
        observedAt: nowIso
      }
    ];
  }

  async suggestion(): Promise<QuotaSuggestion | null> {
    // Highest priority candidate: Antigravity - Personal 3 (78% remaining, resets in 18h)
    return {
      recommendedAccountId: 'antigravity-personal-3',
      providerId: 'antigravity',
      accountAlias: 'Antigravity — Personal 3',
      recommendation: 'burn',
      remainingFraction: 0.78,
      resetsInHours: 18,
      reason: 'You are behind pace for this quota window. 78% remaining quota will expire in 18 hours.',
      suggestedJobType: 'repo_lab'
    };
  }
}
