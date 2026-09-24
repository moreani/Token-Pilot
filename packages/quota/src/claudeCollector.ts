/**
 * claudeCollector.ts
 *
 * Reads Claude Desktop / Claude Code local data to extract account info
 * and quota from plan-usage-history.json.
 *
 * Field meanings (from Claude Desktop's internal schema):
 *   fh  = fast-hour messages used in the current 5-hour rolling window
 *   sd  = slow-down (weekly) messages used
 *
 * Claude Max plan limits (approximate):
 *   - 100 fast messages per 5-hour window  →  "Current session"
 *   - 20  slow-down messages per week       →  "This week"
 */

import fs from 'node:fs';
import path from 'node:path';

export interface ClaudeAccountQuota {
  accountId: string;
  email: string | null;
  name: string | null;
  plan: string;

  // 5-hour session window
  fhUsed: number;
  fhLimit: number;
  fhResetsAt: string | null;    // ISO string
  fhResetLabel: string;         // e.g. "Resets at 5:01 PM"

  // Weekly window
  sdUsed: number;
  sdLimit: number;
  sdResetsAt: string | null;    // ISO string
  sdResetLabel: string;         // e.g. "Resets at 10:34 PM (Thu Sep 24)"

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

interface PlanSample {
  t: number; // epoch ms
  org: string;
  u: { fh: number; sd: number };
}

interface PlanUsageHistoryV2 {
  version: number;
  samples: PlanSample[];
}

interface ClaudeConfig {
  lastKnownAccountUuid?: string;
  [key: string]: unknown;
}

/** Format a Date as "Resets at 5:01 PM" */
function formatResetTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  return `Resets at ${h12}:${mm} ${ampm}`;
}

/** Format a Date as "Resets at 10:34 PM (Thu Sep 24)" */
function formatWeeklyResetLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, '0');
  const day = days[d.getDay()];
  const mon = months[d.getMonth()];
  const date = d.getDate();
  return `Resets at ${h12}:${mm} ${ampm} (${day} ${mon} ${date})`;
}

/**
 * Determine plan tier from the historical max fh value seen.
 * Claude Pro: ~20/5h, Claude Max: ~100/5h, Claude Max 5x: ~500/5h
 */
function detectPlan(samples: PlanSample[]): { plan: string; fhLimit: number; sdLimit: number } {
  const maxFh = Math.max(...samples.map((s) => s.u.fh ?? 0));
  if (maxFh > 100) return { plan: 'Max 5x', fhLimit: 500, sdLimit: 100 };
  if (maxFh > 20)  return { plan: 'Max',    fhLimit: 100, sdLimit: 20 };
  return                      { plan: 'Pro',    fhLimit: 20,  sdLimit: 10 };
}

/**
 * Find when the current 5-hour fh window started by looking for
 * the last drop in fh back to ≤2 (reset event).
 * Returns the ISO timestamp of when the next reset will occur (start + 5h).
 */
function computeFhReset(samples: PlanSample[], now: Date): { resetsAt: string | null; resetLabel: string } {
  let lastResetTs: number | null = null;

  for (let i = samples.length - 1; i > 0; i--) {
    const prevFh = samples[i - 1].u.fh;
    const currFh = samples[i].u.fh;
    if (currFh < prevFh && currFh <= 2) {
      lastResetTs = samples[i].t;
      break;
    }
  }

  if (lastResetTs === null) {
    return { resetsAt: null, resetLabel: 'Resets every 5h' };
  }

  const windowStart = new Date(lastResetTs);
  const windowEnd = new Date(windowStart.getTime() + 5 * 60 * 60 * 1000); // +5h

  // If window already expired, next reset is unknown — just show "Resets every 5h"
  if (windowEnd <= now) {
    return { resetsAt: null, resetLabel: 'Resets every 5h' };
  }

  return {
    resetsAt: windowEnd.toISOString(),
    resetLabel: formatResetTime(windowEnd)
  };
}

/**
 * Find when the weekly sd window resets by looking for the last sd drop,
 * then projecting forward in weekly increments until it's in the future.
 */
function computeSdReset(samples: PlanSample[], now: Date): { resetsAt: string | null; resetLabel: string } {
  let lastSdResetTs: number | null = null;

  for (let i = samples.length - 1; i > 0; i--) {
    const prevSd = samples[i - 1].u.sd;
    const currSd = samples[i].u.sd;
    if (currSd < prevSd) {
      lastSdResetTs = samples[i].t;
      break;
    }
  }

  if (lastSdResetTs === null) {
    // Fallback: use next Monday midnight
    const nextMon = new Date(now);
    nextMon.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
    nextMon.setHours(0, 0, 0, 0);
    return {
      resetsAt: nextMon.toISOString(),
      resetLabel: formatWeeklyResetLabel(nextMon)
    };
  }

  // Project the last reset forward by weekly intervals until it's in the future
  let nextReset = new Date(lastSdResetTs);
  while (nextReset <= now) {
    nextReset = new Date(nextReset.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return {
    resetsAt: nextReset.toISOString(),
    resetLabel: formatWeeklyResetLabel(nextReset)
  };
}

export function fetchClaudeAccountQuota(): ClaudeAccountQuota | null {
  const appSupport = getClaudeAppSupportPath();

  // Read usage history
  const historyPath = path.join(appSupport, 'plan-usage-history.json');
  const history = readJsonFile<PlanUsageHistoryV2>(historyPath);

  if (!history || !Array.isArray(history.samples) || history.samples.length === 0) {
    return null;
  }

  const samples = history.samples;
  const latest = samples[samples.length - 1];
  const fhUsed = latest.u.fh ?? 0;
  const sdUsed = latest.u.sd ?? 0;
  const observedAt = new Date(latest.t).toISOString();
  const now = new Date();

  // Detect plan tier
  const { plan, fhLimit, sdLimit } = detectPlan(samples);

  // Compute reset times
  const fhReset = computeFhReset(samples, now);
  const sdReset = computeSdReset(samples, now);

  // Try to read config for account UUID
  const configPath = path.join(appSupport, 'config.json');
  const config = readJsonFile<ClaudeConfig>(configPath);
  const accountUuid = (config?.lastKnownAccountUuid as string) || latest.org || 'claude-unknown';

  return {
    accountId: `claude-${accountUuid.slice(0, 8)}`,
    email: null,
    name: 'Jitendra Jain',
    plan,
    fhUsed,
    fhLimit,
    fhResetsAt: fhReset.resetsAt,
    fhResetLabel: fhReset.resetLabel,
    sdUsed,
    sdLimit,
    sdResetsAt: sdReset.resetsAt,
    sdResetLabel: sdReset.resetLabel,
    observedAt
  };
}
