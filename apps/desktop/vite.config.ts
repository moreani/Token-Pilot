import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { execSync } from 'node:child_process';
import { fetchAllAntigravityAccountsTelemetry, fetchWarpAccountsQuota, fetchClaudeAccountQuota } from '@tokenpilot/quota/node';

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
          const cachePath = path.join(process.env.HOME || '', '.tokenpilot_tokscale_cache.json');

          try {
            // Protect against CLI hang / network lag with strict 4000ms timeout
            const raw = execSync('npx tokscale usage --json', { encoding: 'utf8', timeout: 4000 });
            items = JSON.parse(raw);
            if (Array.isArray(items) && items.length > 0) {
              // Format OpenCode items so Monthly allowance is primary with clean reset/expiry labels
              for (const it of items) {
                if (it.provider && it.provider.toLowerCase().includes('opencode') && Array.isArray(it.metrics)) {
                  const monthlyIdx = it.metrics.findIndex((m: any) => m.label?.toLowerCase().includes('month'));
                  if (monthlyIdx > 0) {
                    const [monthly] = it.metrics.splice(monthlyIdx, 1);
                    it.metrics.unshift(monthly);
                  }
                  for (const m of it.metrics) {
                    if (m.label?.toLowerCase().includes('month')) {
                      m.label = 'Monthly Allowance';
                      if (m.resets_at) {
                        const d = new Date(m.resets_at);
                        const formatted = !isNaN(d.getTime())
                          ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : '';
                        m.reset_label = formatted ? `Resets ${formatted} (Monthly)` : 'Resets monthly';
                      }
                    } else if (m.label?.toLowerCase().includes('rolling')) {
                      m.label = 'Session (5-Hour Rolling)';
                      m.reset_label = '5-hour rolling session';
                    } else if (m.label?.toLowerCase().includes('week')) {
                      m.label = 'Weekly Allowance';
                    }
                  }
                }
              }
              try {
                fs.writeFileSync(cachePath, JSON.stringify(items), 'utf8');
              } catch {}
            }
          } catch (tokscaleErr) {
            console.warn('tokscale CLI call failed or timed out, attempting cache fallback:', tokscaleErr);
            // Fallback to last known good cached tokscale result so Codex/OpenCode do not disappear
            try {
              if (fs.existsSync(cachePath)) {
                items = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
              }
            } catch {}
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
                    resets_at: acc.resetsAt || null,
                    reset_label: acc.resetLabel || 'Resets monthly'
                  }
                ],
                windows: [
                  {
                    id: `${acc.accountId}-window-monthly`,
                    label: `Monthly AI Requests (${acc.limit.toLocaleString()}/mo)`,
                    used_percent: Math.round((acc.used / acc.limit) * 100),
                    remaining_percent: Math.round((acc.remaining / acc.limit) * 100),
                    remaining_label: `${acc.remaining.toLocaleString()} left`,
                    resets_at: acc.resetsAt || null,
                    reset_label: acc.resetLabel || 'Resets monthly'
                  }
                ]
              });
            }
          } catch (warpErr) {
            console.warn('Failed to collect Warp accounts in dev server:', warpErr);
          }

          // Add Claude fallback if tokscale didn't return a Claude entry
          const hasClaudeFromTokscale = items.some(
            (it: any) => it.provider && it.provider.toLowerCase().includes('claude')
          );
          if (!hasClaudeFromTokscale) {
            try {
              const claude = fetchClaudeAccountQuota();
              if (claude) {
                const fhRemaining = Math.max(0, claude.fhLimit - claude.fhUsed);
                const sdRemaining = Math.max(0, claude.sdLimit - claude.sdUsed);
                const fhUsedPct = Math.round((claude.fhUsed / claude.fhLimit) * 100);
                const fhRemainingPct = 100 - fhUsedPct;
                const sdUsedPct = Math.round((claude.sdUsed / claude.sdLimit) * 100);
                const sdRemainingPct = 100 - sdUsedPct;
                const displayTitle = claude.name
                  ? `${claude.name} • Claude ${claude.plan}`
                  : `Claude ${claude.plan}`;
                items.push({
                  provider: 'claude',
                  account: claude.accountId,
                  email: claude.email || '',
                  name: claude.name || '',
                  plan: `Claude ${claude.plan}`,
                  display_name: displayTitle,
                  metrics: [
                    {
                      label: 'Current session',
                      used_percent: fhUsedPct,
                      remaining_percent: fhRemainingPct,
                      remaining_label: `${fhRemaining} left`,
                      resets_at: claude.fhResetsAt || null,
                      reset_label: claude.fhResetLabel
                    },
                    {
                      label: 'This week',
                      used_percent: sdUsedPct,
                      remaining_percent: sdRemainingPct,
                      remaining_label: `${sdRemaining} left`,
                      resets_at: claude.sdResetsAt || null,
                      reset_label: claude.sdResetLabel
                    }
                  ],
                  windows: [
                    {
                      id: `${claude.accountId}-window-fh`,
                      label: `Current session (${claude.fhLimit} fast msg/5h)`,
                      used_percent: fhUsedPct,
                      remaining_percent: fhRemainingPct,
                      remaining_label: `${fhRemaining} left`,
                      resets_at: claude.fhResetsAt || null,
                      reset_label: claude.fhResetLabel
                    },
                    {
                      id: `${claude.accountId}-window-sd`,
                      label: `This week (${claude.sdLimit} msg/week)`,
                      used_percent: sdUsedPct,
                      remaining_percent: sdRemainingPct,
                      remaining_label: `${sdRemaining} left`,
                      resets_at: claude.sdResetsAt || null,
                      reset_label: claude.sdResetLabel
                    }
                  ]
                });
              }
            } catch (claudeErr) {
              console.warn('Failed to collect Claude account in dev server:', claudeErr);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(items));
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/antigravity/oauth-url', (_req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'local_active',
          message: 'All Antigravity account details are already securely saved locally in ~/.antigravity-agent/cloud_accounts.db. No browser OAuth login needed.'
        }));
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

      server.middlewares.use('/api/accelerators', (_req: any, res: any) => {
        try {
          const homeDir = process.env.HOME || '';
          const workspaceRoot = path.resolve(__dirname, '../..');
          const skillsDirs = [
            path.join(workspaceRoot, '.agents', 'skills'),
            path.join(process.cwd(), '.agents', 'skills'),
            path.join(homeDir, '.gemini', 'config', 'skills'),
            path.join(homeDir, '.gemini', 'antigravity', 'builtin', 'skills')
          ];

          const localSkills: any[] = [];
          for (const sDir of skillsDirs) {
            if (fs.existsSync(sDir)) {
              const entries = fs.readdirSync(sDir, { withFileTypes: true });
              for (const ent of entries) {
                if (ent.isDirectory()) {
                  const skillMd = path.join(sDir, ent.name, 'SKILL.md');
                  if (fs.existsSync(skillMd)) {
                    try {
                      const content = fs.readFileSync(skillMd, 'utf8');
                      const nameMatch = content.match(/^name:\s*(.+)$/m);
                      const descMatch = content.match(/^description:\s*(.+)$/m);
                      let rawName = nameMatch ? nameMatch[1].trim() : ent.name;
                      rawName = rawName.replace(/^["']|["']$/g, '').trim();
                      let description = `Local ${ent.name} agent skill`;
                      if (descMatch) {
                        const rawDesc = descMatch[1].trim();
                        if (rawDesc === '>-' || rawDesc === '|' || rawDesc === '') {
                          const blockMatch = content.match(/^description:\s*[>|]-?\s*\n((?:[ \t]+[^\n]*\n?)+)/m);
                          if (blockMatch) {
                            description = blockMatch[1].split('\n').map(l => l.trim()).filter(Boolean).join(' ');
                          }
                        } else {
                          description = rawDesc;
                        }
                      }
                      description = description.replace(/^["']|["']$/g, '').trim();

                      let category = 'automation';
                      let speedup = '~3.5x faster';
                      let suggestedJobType = 'repo_lab';
                      let defaultObjective = `Execute automated task utilizing ${rawName}`;
                      let capabilities = ['Local Discovery', 'SKILL.md Spec'];

                      if (ent.name.includes('graphify')) {
                        category = 'architecture';
                        speedup = '4.8x faster exploration';
                        suggestedJobType = 'graphify_dossier';
                        defaultObjective = 'Extract architectural knowledge graph, god nodes, and component relationship map using Graphify';
                        capabilities = ['AST Parsing', 'Community Detection', 'Mermaid Diagrams', 'Sub-graph extraction'];
                      } else if (ent.name.includes('recorder')) {
                        category = 'automation';
                        speedup = 'Pixel-perfect recordings';
                        capabilities = ['Playwright Chromium', 'WebM Video Capture', 'Zero Margin Frames'];
                      } else if (ent.name.includes('generative')) {
                        category = 'developer_tools';
                        speedup = 'Instant visualization';
                        suggestedJobType = 'graphify_dossier';
                        capabilities = ['KaTeX Math', 'Mermaid Diagrams', 'Inline SVG'];
                      } else if (ent.name.includes('customizations') || ent.name.includes('guide')) {
                        category = 'developer_tools';
                        speedup = 'Native protocol binding';
                        capabilities = ['MCP Server Discovery', 'Tool Schema Compilation'];
                      } else if (ent.name.includes('migrate')) {
                        category = 'automation';
                        speedup = 'Zero-manual refactor';
                        capabilities = ['Legacy Script Parsing', 'YAML Frontmatter'];
                      }

                      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).replace(/[-_]/g, ' ');
                      if (!localSkills.some(s => s.id === ent.name)) {
                        localSkills.push({
                          id: ent.name,
                          name: displayName,
                          type: 'local',
                          category,
                          speedup,
                          description,
                          capabilities,
                          suggestedJobType,
                          defaultObjective,
                          path: skillMd
                        });
                      }
                    } catch {}
                  }
                }
              }
            }
          }

          const communityAccelerators = [
            {
              id: 'ast-audit',
              name: 'AST Fast-Track Inspector',
              type: 'community',
              category: 'architecture',
              speedup: '3.2x faster setup',
              description: 'Rapid structural inspection engine that reads abstract syntax trees directly, skipping manual boilerplate scanning.',
              repoUrl: 'https://github.com/facebook/react',
              capabilities: ['Syntax Tree Traversal', 'Export Graphing', 'Dead Code Detection'],
              suggestedJobType: 'repo_lab',
              defaultObjective: 'Investigate architecture, dependencies, and identify potential modernization tasks'
            },
            {
              id: 'code-guard',
              name: 'CodeGuard & CVE Hunter',
              type: 'community',
              category: 'security',
              speedup: '5.0x faster audit',
              description: 'Autonomous zero-trust audit tool scouting hardcoded secrets, insecure API calls, dependency vulnerabilities, and permissive sandbox holes.',
              capabilities: ['Dependency Audit', 'Secret Scanning', 'CVE Database Lookups'],
              suggestedJobType: 'security_audit',
              defaultObjective: 'Audit dependencies for known CVEs, scan source for exposed secrets, and verify sandbox policies'
            },
            {
              id: 'test-booster',
              name: 'Autonomous Test Suite Booster',
              type: 'community',
              category: 'testing',
              speedup: '2.9x faster coverage',
              description: 'Scouts uncovered functions and edge cases in the target repository and automatically synthesizes deterministic unit tests.',
              capabilities: ['Branch Analysis', 'Mock Generation', 'Snapshot Assertions'],
              suggestedJobType: 'test_booster',
              defaultObjective: 'Discover untested modules, analyze edge cases, and synthesize targeted unit test suites'
            }
          ];

          const allSkills = [...localSkills];
          for (const ca of communityAccelerators) {
            if (!allSkills.some(s => s.id === ca.id)) {
              allSkills.push(ca);
            }
          }

          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          res.end(JSON.stringify({ ok: true, refreshedAt: new Date().toISOString(), skills: allSkills }));
        } catch (e: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          res.end(JSON.stringify({ ok: false, error: e.message }));
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
