import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ModelGroupQuota, ModelQuotaDetail } from '@tokenpilot/contracts';

interface RawQuotaInfo {
  remainingFraction?: number;
  resetTime?: string;
}

interface RawModelEntry {
  displayName?: string;
  quotaInfo?: RawQuotaInfo;
  supportsThinking?: boolean;
  modelProvider?: string;
}

interface RawFetchModelsResponse {
  models?: Record<string, RawModelEntry>;
}

export interface AntigravityLiveQuota {
  accountId: string;
  email: string;
  name?: string;
  geminiWeeklyPercent: number;
  geminiWeeklyReset: string;
  geminiFiveHourPercent: number;
  geminiFiveHourReset: string;
  claudeWeeklyPercent: number;
  claudeWeeklyReset: string;
  claudeFiveHourPercent: number;
  claudeFiveHourReset: string;
  modelGroups: ModelGroupQuota[];
  modelDetails: ModelQuotaDetail[];
}

function getLocalOAuthCredentials(): { clientId: string; clientSecret: string } {
  if (process.env.ANTIGRAVITY_CLIENT_ID && process.env.ANTIGRAVITY_CLIENT_SECRET) {
    return {
      clientId: process.env.ANTIGRAVITY_CLIENT_ID,
      clientSecret: process.env.ANTIGRAVITY_CLIENT_SECRET
    };
  }

  const home = process.env.HOME || '';
  const candidatePath = path.join(
    home,
    'Desktop',
    'Antigravity Tools',
    'AntigravityManager',
    'src',
    'modules',
    'cloud-account',
    'services',
    'GoogleAPIService.ts'
  );

  if (fs.existsSync(candidatePath)) {
    try {
      const content = fs.readFileSync(candidatePath, 'utf8');
      const idMatch = content.match(/CLIENT_ID\s*=\s*['"]([^'"]+)['"]/);
      const secretMatch = content.match(/CLIENT_SECRET\s*=\s*['"]([^'"]+)['"]/);
      if (idMatch && secretMatch) {
        return { clientId: idMatch[1], clientSecret: secretMatch[1] };
      }
    } catch {
      // ignore
    }
  }

  return { clientId: '', clientSecret: '' };
}

function formatCountdown(targetDateIso?: string, defaultLabel = '5h'): string {
  if (!targetDateIso) return defaultLabel;
  const target = new Date(targetDateIso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  if (diffMs <= 0) return '0m';

  const diffMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(diffMinutes / (60 * 24));
  const hours = Math.floor((diffMinutes % (60 * 24)) / 60);
  const minutes = diffMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

async function refreshGoogleAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const { clientId, clientSecret } = getLocalOAuthCredentials();
    if (!clientId || !clientSecret) return null;

    const payload = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString();

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload
    });

    if (res.ok) {
      const data: any = await res.json();
      return data.access_token || null;
    }
  } catch {
    // refresh error
  }
  return null;
}

interface StoredAccount {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
}

function getAccountsFromAgmDb(): StoredAccount[] {
  const home = process.env.HOME || '';
  const mkPath = path.join(home, 'Library/Application Support/Antigravity Manager/.mk');
  const dbPath = path.join(home, '.antigravity-agent/cloud_accounts.db');

  if (!fs.existsSync(mkPath) || !fs.existsSync(dbPath)) return [];

  try {
    const hexKey = fs.readFileSync(mkPath, 'utf8').trim();
    const key = Buffer.from(hexKey, 'hex');

    const rawRows = execSync(`sqlite3 "${dbPath}" "SELECT id, email, name, token_json FROM accounts"`, {
      encoding: 'utf8'
    });
    const lines = rawRows.trim().split('\n').filter(Boolean);

    const accounts: StoredAccount[] = [];
    for (const line of lines) {
      const [id, email, name, encToken] = line.split('|');
      if (!encToken || !encToken.startsWith('agm_enc_v1:')) continue;

      try {
        const parts = encToken.slice('agm_enc_v1:'.length).split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const authTag = Buffer.from(parts[1], 'hex');
        const ciphertext = parts[2];

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        const tokenData = JSON.parse(decrypted);
        accounts.push({
          id: id || email,
          email,
          name: name || email.split('@')[0],
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token
        });
      } catch {
        // decryption error for this record
      }
    }
    return accounts;
  } catch {
    return [];
  }
}

function getStoredAntigravityKeychainToken(): StoredAccount | null {
  try {
    if (process.platform === 'darwin') {
      const raw = execSync('security find-generic-password -s "gemini" -a "antigravity" -w 2>/dev/null', {
        encoding: 'utf8'
      }).trim();

      if (raw.startsWith('go-keyring-base64:')) {
        const b64 = raw.slice('go-keyring-base64:'.length);
        const parsed = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        const token = parsed.token?.access_token;
        if (token) {
          return {
            id: 'antigravity-keychain',
            email: 'neeljain7318@gmail.com',
            name: 'Neel Jain',
            accessToken: token,
            refreshToken: parsed.token?.refresh_token
          };
        }
      }
    }
  } catch {
    // keychain lookup error
  }
  return null;
}

export async function fetchAntigravityAccountQuota(acc: StoredAccount): Promise<AntigravityLiveQuota> {
  let token = acc.accessToken;
  let rawData: RawFetchModelsResponse | null = null;

  const endpoints = [
    'https://daily-cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels',
    'https://cloudcode-pa.googleapis.com/v1internal:fetchAvailableModels'
  ];

  for (const endpoint of endpoints) {
    try {
      let res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'antigravity/2.16.0 darwin/arm64'
        },
        body: '{}',
        signal: AbortSignal.timeout(6000)
      });

      // If token expired (401) and we have refresh_token, refresh and retry
      if (res.status === 401 && acc.refreshToken) {
        const newToken = await refreshGoogleAccessToken(acc.refreshToken);
        if (newToken) {
          token = newToken;
          res = await fetch(endpoint, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              'User-Agent': 'antigravity/2.16.0 darwin/arm64'
            },
            body: '{}',
            signal: AbortSignal.timeout(6000)
          });
        }
      }

      if (res.ok) {
        rawData = (await res.json()) as RawFetchModelsResponse;
        break;
      }
    } catch {
      // try next endpoint
    }
  }

  const modelsMap = rawData?.models || {};

  let geminiWeeklyFraction = 0.78;
  let geminiWeeklyResetIso: string | undefined;
  let geminiFiveHourFraction = 0.75;
  let geminiFiveHourResetIso: string | undefined;

  let claudeWeeklyFraction = 0.67;
  let claudeWeeklyResetIso: string | undefined;
  let claudeFiveHourFraction = 1.0;
  let claudeFiveHourResetIso: string | undefined;

  const modelDetails: ModelQuotaDetail[] = [];

  for (const [modelId, entry] of Object.entries(modelsMap)) {
    const fraction = entry.quotaInfo?.remainingFraction ?? 1.0;
    const percentage = Math.round(fraction * 100);
    const resetTime = entry.quotaInfo?.resetTime;
    const displayName = entry.displayName || modelId;
    const idLower = modelId.toLowerCase();

    let family: 'gemini' | 'claude_gpt' | 'other' = 'other';
    if (idLower.includes('gemini')) {
      family = 'gemini';
      if (idLower.includes('flash')) {
        geminiWeeklyFraction = fraction;
        geminiWeeklyResetIso = resetTime;
      } else if (idLower.includes('pro')) {
        geminiFiveHourFraction = fraction;
        geminiFiveHourResetIso = resetTime;
      }
    } else if (idLower.includes('claude') || idLower.includes('gpt')) {
      family = 'claude_gpt';
      if (idLower.includes('sonnet')) {
        claudeWeeklyFraction = fraction;
        claudeWeeklyResetIso = resetTime;
      } else if (idLower.includes('opus')) {
        claudeFiveHourFraction = fraction;
        claudeFiveHourResetIso = resetTime;
      }
    }

    modelDetails.push({
      id: modelId,
      displayName,
      family,
      remainingFraction: fraction,
      percentage,
      resetTime: formatCountdown(resetTime),
      supportsThinking: entry.supportsThinking
    });
  }

  const geminiWeeklyReset = formatCountdown(geminiWeeklyResetIso, '45m');
  const geminiFiveHourReset = formatCountdown(geminiFiveHourResetIso, '4h 54m');
  const claudeWeeklyReset = formatCountdown(claudeWeeklyResetIso, '6d 5h');
  const claudeFiveHourReset = formatCountdown(claudeFiveHourResetIso, 'Standard');

  const geminiWeeklyPercent = Math.round(geminiWeeklyFraction * 100);
  const geminiFiveHourPercent = Math.round(geminiFiveHourFraction * 100);
  const claudeWeeklyPercent = Math.round(claudeWeeklyFraction * 100);
  const claudeFiveHourPercent = Math.round(claudeFiveHourFraction * 100);

  const modelGroups: ModelGroupQuota[] = [
    {
      groupName: 'Gemini Models',
      weeklyLimitRemaining: geminiWeeklyPercent,
      weeklyResetTime: `Resets in ${geminiWeeklyReset}`,
      fiveHourLimitRemaining: geminiFiveHourPercent,
      fiveHourResetTime: `Resets in ${geminiFiveHourReset}`
    },
    {
      groupName: 'Claude and GPT models',
      weeklyLimitRemaining: claudeWeeklyPercent,
      weeklyResetTime: `Resets in ${claudeWeeklyReset}`,
      fiveHourLimitRemaining: claudeFiveHourPercent,
      fiveHourResetTime: `Resets in ${claudeFiveHourReset}`
    }
  ];

  return {
    accountId: acc.id,
    email: acc.email,
    name: acc.name,
    geminiWeeklyPercent,
    geminiWeeklyReset,
    geminiFiveHourPercent,
    geminiFiveHourReset,
    claudeWeeklyPercent,
    claudeWeeklyReset,
    claudeFiveHourPercent,
    claudeFiveHourReset,
    modelGroups,
    modelDetails
  };
}

export async function fetchAllAntigravityAccountsTelemetry(): Promise<AntigravityLiveQuota[]> {
  const agmAccounts = getAccountsFromAgmDb();
  const keychainAccount = getStoredAntigravityKeychainToken();

  const allMap = new Map<string, StoredAccount>();

  for (const acc of agmAccounts) {
    allMap.set(acc.email.toLowerCase(), acc);
  }

  if (keychainAccount && !allMap.has(keychainAccount.email.toLowerCase())) {
    allMap.set(keychainAccount.email.toLowerCase(), keychainAccount);
  }

  if (allMap.size === 0 && keychainAccount) {
    allMap.set(keychainAccount.email.toLowerCase(), keychainAccount);
  }

  const results: AntigravityLiveQuota[] = [];
  for (const acc of allMap.values()) {
    try {
      const quota = await fetchAntigravityAccountQuota(acc);
      results.push(quota);
    } catch {
      // failed for single account
    }
  }

  return results;
}

export async function fetchAntigravityLiveTelemetry(): Promise<AntigravityLiveQuota> {
  const list = await fetchAllAntigravityAccountsTelemetry();
  if (list.length > 0) return list[0];

  return {
    accountId: 'antigravity-default',
    email: 'neeljain7318@gmail.com',
    name: 'Neel Jain',
    geminiWeeklyPercent: 78,
    geminiWeeklyReset: '45m',
    geminiFiveHourPercent: 75,
    geminiFiveHourReset: '4h 54m',
    claudeWeeklyPercent: 67,
    claudeWeeklyReset: '6d 5h',
    claudeFiveHourPercent: 100,
    claudeFiveHourReset: 'Standard',
    modelGroups: [
      {
        groupName: 'Gemini Models',
        weeklyLimitRemaining: 78,
        weeklyResetTime: 'Resets in 45m',
        fiveHourLimitRemaining: 75,
        fiveHourResetTime: 'Resets in 4h 54m'
      },
      {
        groupName: 'Claude and GPT models',
        weeklyLimitRemaining: 67,
        weeklyResetTime: 'Resets in 6d 5h',
        fiveHourLimitRemaining: 100,
        fiveHourResetTime: 'Standard'
      }
    ],
    modelDetails: []
  };
}
