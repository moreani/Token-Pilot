import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ShieldCheck, Cpu, HardDrive, Flame, AlertTriangle, LayoutGrid, Clock, Calendar, Play, ChevronRight } from 'lucide-react';


import type { Account, ClientState } from '../state/clientService.js';
import { TopAlertBanner } from '../components/TopAlertBanner.js';
import { QuotaCard } from '../components/QuotaCard.js';
import { QUOTA_RANGES, getQuotaRangeTier } from '../utils/quotaRanger.js';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

interface DashboardProps {
  state: ClientState;
  onRefreshQuotas: () => Promise<void>;
  onUseCredit: () => void;
  onSelectAccountForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
  onStartJob?: () => void;
}

function useTimeSince(ts: number | null): string {
  const [label, setLabel] = useState('');
  useEffect(() => {
    if (!ts) return;
    const update = () => {
      const secs = Math.floor((Date.now() - ts) / 1000);
      if (secs < 10) setLabel('just now');
      else if (secs < 60) setLabel(`${secs}s ago`);
      else if (secs < 3600) setLabel(`${Math.floor(secs / 60)}m ago`);
      else setLabel(`${Math.floor(secs / 3600)}h ago`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [ts]);
  return label;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  onRefreshQuotas,
  onUseCredit,
  onSelectAccountForJob,
  onUpdateAlias,
  onStartJob
}) => {
  const [providerFilter, setProviderFilter] = useState<'all' | string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lastRefreshedLabel = useTimeSince(lastRefreshedAt);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefreshQuotas();
      setLastRefreshedAt(Date.now());
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefreshQuotas]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    autoRefreshRef.current = setInterval(() => {
      handleRefresh();
    }, AUTO_REFRESH_MS);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [handleRefresh]);

  const activeProviders = state.providers.filter((p) =>
    state.accounts.some((a) => a.providerId === p.id)
  );

  const filteredProviders = providerFilter === 'all'
    ? activeProviders
    : activeProviders.filter((p) => p.id === providerFilter);

  // Low quota accounts (<= 15% remaining on any window/model group)
  const lowQuotaAccounts = state.accounts.filter((acc) => {
    const snap = state.snapshots.find((s) => s.accountId === acc.id);
    if (!snap?.windows || snap.windows.length === 0) return false;
    if (acc.providerId === 'opencode') {
      const monthlyWin = snap.windows.find((w) => w.label.toLowerCase().includes('month')) || snap.windows[0];
      return (monthlyWin?.remainingFraction ?? 1) <= 0.15 || snap.recommendation === 'conserve';
    }
    return snap.windows.some((w) => (w.remainingFraction ?? 1) <= 0.15) || snap.recommendation === 'conserve';
  });

  const accountsByProvider = filteredProviders.map((p) => ({
    provider: p,
    accounts: state.accounts.filter((a) => a.providerId === p.id)
  }));

  const totalAccounts = state.accounts.length;
  const burnCount = state.snapshots.filter((s) => s.recommendation === 'burn').length;

  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');

  const timelineAccounts = [...state.accounts].map((acc) => {
    const snap = state.snapshots.find((s) => s.accountId === acc.id);
    const primaryWin = snap?.windows[0];
    const resetMs = primaryWin?.resetsAt ? new Date(primaryWin.resetsAt).getTime() : null;
    const diffHours = resetMs ? Math.max(0, (resetMs - Date.now()) / (1000 * 3600)) : null;
    const remainingPct = primaryWin?.remainingFraction !== null && primaryWin?.remainingFraction !== undefined
      ? Math.round(primaryWin.remainingFraction * 100)
      : 100;
    const isUrgentBurn = remainingPct > 50 && diffHours !== null && diffHours <= 48;
    const isConserve = remainingPct <= 15;
    const provider = state.providers.find((p) => p.id === acc.providerId);

    return {
      account: acc,
      snapshot: snap,
      primaryWin,
      resetMs,
      diffHours,
      remainingPct,
      isUrgentBurn,
      isConserve,
      provider
    };
  }).sort((a, b) => {
    if (a.isUrgentBurn && !b.isUrgentBurn) return -1;
    if (!a.isUrgentBurn && b.isUrgentBurn) return 1;
    if (a.resetMs !== null && b.resetMs !== null) return a.resetMs - b.resetMs;
    if (a.resetMs !== null) return -1;
    if (b.resetMs !== null) return 1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      {/* Top Banner Recommendation */}
      <TopAlertBanner suggestion={state.suggestion} onUseCredit={onUseCredit} />



      {/* Low Quota Warning Banner */}
      {lowQuotaAccounts.length > 0 && (
        <div className="mb-4 flex items-start space-x-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div>
            <span className="font-semibold">Low quota alert: </span>
            {lowQuotaAccounts.map((a) => {
              const snap = state.snapshots.find((s) => s.accountId === a.id);
              const minWin = a.providerId === 'opencode'
                ? (snap?.windows?.find((w) => w.label?.toLowerCase().includes('month')) || snap?.windows[0])
                : snap?.windows?.reduce((min, w) => (((w.remainingFraction ?? 1) < (min.remainingFraction ?? 1)) ? w : min), snap?.windows[0]);
              const pct = Math.round((minWin?.remainingFraction ?? 0) * 100);
              const name = a.displayAlias.split('•')[0].split('(')[0].trim();
              const label = minWin?.label?.toLowerCase().includes('claude') ? 'Claude 0%' : `${pct}% left`;
              return `${name} (${label})`;
            }).join(' · ')}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center space-x-2 text-xs">
            <Cpu className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Monitored Accounts</span>
          </div>
          <p className="heading-500 text-2xl font-medium font-mono text-[var(--text-main)] mt-1">{totalAccounts}</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center space-x-2 text-xs">
            <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">At-Risk Quotas</span>
          </div>
          <p className="heading-500 text-2xl font-medium font-mono text-amber-600 dark:text-amber-400 mt-1">{burnCount} Burn Alerts</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center space-x-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Sandbox Isolation</span>
          </div>
          <p className="heading-500 text-2xl font-medium font-mono text-emerald-600 dark:text-emerald-400 mt-1">Balanced Profile</p>
        </div>

        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center space-x-2 text-xs">
            <HardDrive className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Local Storage</span>
          </div>
          <p className="heading-500 text-2xl font-medium font-mono text-cyan-600 dark:text-cyan-400 mt-1">SQLite Encrypted</p>
        </div>
      </div>

      {/* Quota Ranger System Legend Bar */}
      <div className="mb-5 p-3 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="heading-500 font-medium text-[var(--text-main)]">Quota Ranger System:</span>
          <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Adaptive progress indicators</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {QUOTA_RANGES.map((r) => (
            <div
              key={r.id}
              className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-md border text-[11px] font-light ${r.badgeBg} ${r.badgeText} ${r.badgeBorder}`}
            >
              <span className={`w-2 h-2 rounded-full ${r.dotColor}`}></span>
              <span className="font-medium">{r.label}</span>
              <span className="opacity-75">({r.minPercent}-{r.maxPercent}%)</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="heading-500 text-xl font-medium tracking-tight text-[var(--text-main)]">
            AI Coding Accounts &amp; Quota Windows
          </h2>
          <p className="paragraph-300 text-xs mt-0.5 font-light text-[var(--text-main)] opacity-70">
            Real-time capacity tracking across all configured providers. Multiple accounts per provider supported.
          </p>
        </div>

        {/* Refresh button with last-refreshed label */}
        <div className="flex flex-col items-end">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
                isRefreshing
                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 opacity-60 cursor-not-allowed'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
              } text-[var(--text-main)]`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing…' : 'Refresh Quotas'}</span>
            </button>
            {lastRefreshedAt && !isRefreshing && (
              <span className="text-[10px] opacity-50 mt-0.5 font-mono text-[var(--text-main)]">
                Updated {lastRefreshedLabel}
              </span>
            )}
            {!lastRefreshedAt && (
              <span className="text-[10px] opacity-40 mt-0.5 font-mono text-[var(--text-main)]">
                Auto-refreshes every 5m
              </span>
            )}
          </div>
        </div>

      {/* View Switcher and Quick Filter Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        {viewMode === 'grid' ? (
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setProviderFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                providerFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              All Providers ({state.accounts.length})
            </button>
            {activeProviders.map((p) => {
              const count = state.accounts.filter((a) => a.providerId === p.id).length;
              const hasLow = state.accounts
                .filter((a) => a.providerId === p.id)
                .some((a) => {
                  const snap = state.snapshots.find((s) => s.accountId === a.id);
                  if (a.providerId === 'opencode') {
                    const monthlyWin = snap?.windows?.find((w) => w.label.toLowerCase().includes('month')) || snap?.windows[0];
                    return (monthlyWin?.remainingFraction ?? 1) <= 0.15 || snap?.recommendation === 'conserve';
                  }
                  return snap?.windows?.some((w) => (w.remainingFraction ?? 1) <= 0.15) || snap?.recommendation === 'conserve';
                });
              return (
                <button
                  key={p.id}
                  onClick={() => setProviderFilter(p.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    providerFilter === p.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{p.displayName} ({count})</span>
                  {hasLow && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-xs paragraph-300 font-light text-[var(--text-main)] opacity-75">
            <Clock className="w-4 h-4 text-blue-500" />
            <span>Accounts ranked by reset urgency and remaining capacity. Burn targets prioritized.</span>
          </div>
        )}

        {/* View Mode Toggle: Grid vs Timeline */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white dark:bg-slate-900 text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-main)] opacity-60 hover:opacity-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Accounts Grid</span>
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white dark:bg-slate-900 text-[var(--text-main)] shadow-xs'
                : 'text-[var(--text-main)] opacity-60 hover:opacity-100'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiry Timeline</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Expiry Timeline */}
      {viewMode === 'timeline' && (
        <div className="space-y-3">
          {timelineAccounts.map((item, idx) => {
            const { account, primaryWin, diffHours, remainingPct, isUrgentBurn, isConserve, provider } = item;
            const rangerTier = getQuotaRangeTier(remainingPct);
            const resetLabel = (primaryWin as any)?.resetLabel || (primaryWin?.resetsAt ? new Date(primaryWin.resetsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Continuous');

            return (
              <div
                key={account.id}
                className={`p-4 rounded-2xl border bg-white dark:bg-slate-900 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  isUrgentBurn
                    ? 'border-amber-400/60 dark:border-amber-500/40 ring-1 ring-amber-400/20'
                    : isConserve
                    ? 'border-rose-300 dark:border-rose-800'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left: Rank, Provider, Identity */}
                <div className="flex items-center space-x-3 min-w-[260px]">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-medium flex items-center justify-center text-[var(--text-main)] opacity-60">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-blue-500 dark:text-blue-400 font-medium">
                        {provider?.displayName || account.providerId}
                      </span>
                      {isUrgentBurn && (
                        <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-mono">
                          <Flame className="w-3 h-3 fill-amber-500" />
                          <span>Urgent Burn</span>
                        </span>
                      )}
                      {isConserve && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-mono">
                          Conserve
                        </span>
                      )}
                    </div>
                    <h4 className="heading-500 text-sm font-medium text-[var(--text-main)] truncate max-w-[240px]">
                      {account.displayAlias.split('•')[0].trim()}
                    </h4>
                  </div>
                </div>

                {/* Center: Quota Allowance Progress */}
                <div className="flex-1 max-w-md space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">
                      {primaryWin?.label || 'Primary Allowance'}
                    </span>
                    <span className={`font-mono font-medium text-xs ${rangerTier.textClass}`}>
                      {remainingPct}% remaining
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${rangerTier.gradientClass}`}
                      style={{ width: `${remainingPct}%` }}
                    />
                  </div>
                </div>

                {/* Right: Reset Countdown & Action Button */}
                <div className="flex items-center space-x-4 shrink-0 justify-between md:justify-end">
                  <div className="text-right">
                    <div className="text-xs font-mono font-medium text-[var(--text-main)] flex items-center space-x-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{resetLabel}</span>
                    </div>
                    <div className="text-[10px] opacity-50 font-mono">
                      {diffHours !== null ? `${Math.round(diffHours)} hours remaining` : 'Continuous Window'}
                    </div>
                  </div>

                  {account.capabilities.executeJobs ? (
                    <button
                      onClick={() => onSelectAccountForJob(account)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-xs ${
                        isUrgentBurn
                          ? 'bg-amber-600 hover:bg-amber-500 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isUrgentBurn ? 'Burn Now' : 'Run Job'}</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-mono opacity-40 italic">Monitor Only</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Provider & Account Cards Grid */}
      {viewMode === 'grid' && (
      <div className="space-y-6">
        {accountsByProvider.filter(({ accounts }) => accounts.length > 0).map(({ provider, accounts }) => (
          <div key={provider.id} className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-medium tracking-wider uppercase text-[var(--text-main)] opacity-80">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{provider.displayName}</span>
              <span className="opacity-50">({accounts.length} accounts)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accounts.map((account) => {
                const snapshot = state.snapshots.find((s) => s.accountId === account.id);
                return (
                  <div key={account.id} className="h-full">
                    <QuotaCard
                      account={account}
                      provider={provider}
                      snapshot={snapshot}
                      onSelectForJob={onSelectAccountForJob}
                      onUpdateAlias={onUpdateAlias}
                      onRefresh={handleRefresh}
                    />

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};
