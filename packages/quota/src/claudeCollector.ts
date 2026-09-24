/**
 * claudeCollector.ts
 *
 * Reads Claude Desktop / Claude Code local data to extract account info
 * and 5-hour / slow-down usage from plan-usage-history.json.
 *
 * Docs on fields:
 *   fh  = fast-hour bucket used (Claude Max: ~100 fast messages per 5h window)
 *   sd  = slow-down messages used (Claude Max: additional slower messages)
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ClaudeAccountQuota {
  accountId: string;
  email: string | null;
  name: string | null;
  plan: string;
  /** 5-hour fast messages used */
  fhUsed: number;
  /** 5-hour fast messages limit (estimated) */
  fhLimit: number;
  /** Slow-down messages used */
  sdUsed: number;
  /** Slow-down messages limit (estimated) */
  sdLimit: number;
  observedAt: string;
}

function getClaudeAppSupportPath(): string {
  const home = process.env.HOME || '';
  return path.join(home, 'Library', 'Application Support', 'Claude');
}

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface PlanUsageHistoryV2 {
  version: number;
  samples: Array<{
    t: number; // epoch ms
    org: string;
    u: { fh: number; sd: number };
  }>;
}

interface ClaudeConfig {
  lastKnownAccountUuid?: string;
  [key: string]: unknown;
}

/**
 * Claude Max plan limits (approximate, as of 2026):
 *   - 100 fast-hour (fh) messages per 5-hour rolling window
 *   - 20 slow-down (sd) messages per 5-hour rolling window
 * These are heuristic maximums — the actual cap may vary by plan tier.
 */
const CLAUDE_MAX_FH_LIMIT = 100;
const CLAUDE_MAX_SD_LIMIT = 20;

export function fetchClaudeAccountQuota(): ClaudeAccountQuota | null {
  const appSupport = getClaudeAppSupportPath();

  // Read usage history
  const historyPath = path.join(appSupport, 'plan-usage-history.json');
  const history = readJsonFile<PlanUsageHistoryV2>(historyPath);

  if (!history || !Array.isArray(history.samples) || history.samples.length === 0) {
    return null;
  }

  const latest = history.samples[history.samples.length - 1];
  const fhUsed = latest.u.fh ?? 0;
  const sdUsed = latest.u.sd ?? 0;
  const observedAt = new Date(latest.t).toISOString();

  // Try to read config for account UUID
  const configPath = path.join(appSupport, 'config.json');
  const config = readJsonFile<ClaudeConfig>(configPath);
  const accountUuid = config?.lastKnownAccountUuid || latest.org || 'claude-unknown';

  // Determine plan tier from max fh seen historically
  const maxFhSeen = Math.max(...history.samples.map((s) => s.u.fh ?? 0));
  let plan = 'Max';
  let fhLimit = CLAUDE_MAX_FH_LIMIT;
  let sdLimit = CLAUDE_MAX_SD_LIMIT;

  // Heuristic: if max fh seen > 100, might be higher tier
  if (maxFhSeen > 100) {
    plan = 'Max 5x';
    fhLimit = 500;
    sdLimit = 100;
  } else if (maxFhSeen <= 20) {
    plan = 'Pro';
    fhLimit = 20;
    sdLimit = 10;
  }

  return {
    accountId: `claude-${accountUuid.slice(0, 8)}`,
    email: null, // Claude Desktop doesn't expose email in local files
    name: 'Jitendra Jain', // fallback display name
    plan,
    fhUsed,
    fhLimit,
    sdUsed,
    sdLimit,
    observedAt
  };
}
