import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { fetchAllAntigravityAccountsTelemetry, fetchWarpAccountsQuota } from '@tokenpilot/quota/node';

import fs from 'node:fs';
import path from 'node:path';

function getGoogleClientId(): string {
  if (process.env.ANTIGRAVITY_CLIENT_ID) return process.env.ANTIGRAVITY_CLIENT_ID;
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
      const match = content.match(/CLIENT_ID\s*=\s*['"]([^'"]+)['"]/);
      if (match) return match[1];
    } catch {
      // ignore
    }
  }
  return '';
}

function buildGoogleOAuthUrl(email?: string): string {
  const clientId = getGoogleClientId();
  const scopes = [
    'https://www.googleapis.com/auth/cloud-platform',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/cclog',
    'https://www.googleapis.com/auth/experimentsandconfigs',
    'https://www.googleapis.com/auth/aicode'
  ].join(' ');

  const redirectUri = 'http://localhost:8888/oauth-callback';

  const params = new URLSearchParams({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    include_granted_scopes: 'true',
    state: `tokenpilot-${Date.now()}`
  });

  if (email) {
    params.set('login_hint', email);
  }

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}


function realQuotaApiPlugin() {
  return {
    name: 'real-quota-api',
    configureServer(server: any) {
      server.middlewares.use('/api/quota', async (_req: any, res: any) => {
        try {
          let items: any[] = [];
          try {
            const raw = execSync('npx tokscale usage --json', { encoding: 'utf8' });
            items = JSON.parse(raw);
          } catch {
            items = [];
          }

          // Fetch all connected Google Antigravity accounts (multi-account)
          const agAccounts = await fetchAllAntigravityAccountsTelemetry();

          for (const acc of agAccounts) {
            const formattedName = acc.name
              ? acc.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
              : '';
            
            const displayTitle = formattedName
              ? `${formattedName} (${acc.email})`
              : acc.email;

            items.push({
              provider: 'antigravity',
              account: acc.email,
              email: acc.email,
              name: formattedName,
              plan: 'Google Antigravity',
              display_name: displayTitle,
              metrics: [
                {
                  label: 'Gemini Weekly',
                  used_percent: 100 - acc.geminiWeeklyPercent,
                  remaining_percent: acc.geminiWeeklyPercent,
                  remaining_label: `${acc.geminiWeeklyPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.geminiWeeklyReset}`
                },
                {
                  label: 'Gemini 5-Hour',
                  used_percent: 100 - acc.geminiFiveHourPercent,
                  remaining_percent: acc.geminiFiveHourPercent,
                  remaining_label: `${acc.geminiFiveHourPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.geminiFiveHourReset}`
                },
                {
                  label: 'Claude/GPT Weekly',
                  used_percent: 100 - acc.claudeWeeklyPercent,
                  remaining_percent: acc.claudeWeeklyPercent,
                  remaining_label: `${acc.claudeWeeklyPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.claudeWeeklyReset}`
                },
                {
                  label: 'Claude/GPT 5-Hour',
                  used_percent: 100 - acc.claudeFiveHourPercent,
                  remaining_percent: acc.claudeFiveHourPercent,
                  remaining_label: `${acc.claudeFiveHourPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.claudeFiveHourReset}`
                }
              ],
              windows: [
                {
                  label: 'Gemini Weekly',
                  used_percent: 100 - acc.geminiWeeklyPercent,
                  remaining_percent: acc.geminiWeeklyPercent,
                  remaining_label: `${acc.geminiWeeklyPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.geminiWeeklyReset}`
                },
                {
                  label: 'Gemini 5-Hour',
                  used_percent: 100 - acc.geminiFiveHourPercent,
                  remaining_percent: acc.geminiFiveHourPercent,
                  remaining_label: `${acc.geminiFiveHourPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.geminiFiveHourReset}`
                },
                {
                  label: 'Claude/GPT Weekly',
                  used_percent: 100 - acc.claudeWeeklyPercent,
                  remaining_percent: acc.claudeWeeklyPercent,
                  remaining_label: `${acc.claudeWeeklyPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.claudeWeeklyReset}`
                },
                {
                  label: 'Claude/GPT 5-Hour',
                  used_percent: 100 - acc.claudeFiveHourPercent,
                  remaining_percent: acc.claudeFiveHourPercent,
                  remaining_label: `${acc.claudeFiveHourPercent}%`,
                  resets_at: null,
                  reset_label: `Resets in ${acc.claudeFiveHourReset}`
                }
              ],
              model_groups: acc.modelGroups,
              models: acc.modelDetails
            });
          }

          // Fetch connected Warp AI accounts
          try {
            const warpAccounts = fetchWarpAccountsQuota();
            for (const acc of warpAccounts) {
              const displayTitle = `${acc.name} (${acc.email}) • Warp ${acc.plan}`;
              items.push({
                provider: 'warp',
                account: acc.email,
                email: acc.email,
                name: acc.name,
                plan: `Warp ${acc.plan}`,
                display_name: displayTitle,
                photo_url: acc.photoUrl,
                metrics: [
                  {
                    label: 'Monthly AI Requests',
                    used_percent: Math.round((acc.used / acc.limit) * 100),
                    remaining_percent: Math.round((acc.remaining / acc.limit) * 100),
                    remaining_label: `${acc.remaining.toLocaleString()} left`,
                    resets_at: null,
                    reset_label: 'Resets monthly'
                  }
                ],
                windows: [
                  {
                    id: `${acc.accountId}-window-monthly`,
                    label: `Monthly AI Requests (${acc.limit.toLocaleString()}/mo)`,
                    used_percent: Math.round((acc.used / acc.limit) * 100),
                    remaining_percent: Math.round((acc.remaining / acc.limit) * 100),
                    remaining_label: `${acc.remaining.toLocaleString()} left`,
                    resets_at: null,
                    reset_label: 'Resets monthly'
                  }
                ]
              });
            }
          } catch (warpErr) {
            console.warn('Failed to collect Warp accounts in dev server:', warpErr);
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(items));
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/antigravity/oauth-url', (req: any, res: any) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const email = urlObj.searchParams.get('email') || undefined;
        const oauthUrl = buildGoogleOAuthUrl(email);
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ oauthUrl }));
      });

      server.middlewares.use('/api/models', (_req: any, res: any) => {
        try {
          const raw = execSync('npx tokscale models --json --today', { encoding: 'utf8' });
          res.setHeader('Content-Type', 'application/json');
          res.end(raw);
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), realQuotaApiPlugin()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true
  }
});
