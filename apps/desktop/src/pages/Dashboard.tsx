import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, ShieldCheck, Cpu, HardDrive, Flame, AlertTriangle } from 'lucide-react';


import type { Account, ClientState } from '../state/clientService.js';
import { TopAlertBanner } from '../components/TopAlertBanner.js';
import { QuotaCard } from '../components/QuotaCard.js';
import { QUOTA_RANGES } from '../utils/quotaRanger.js';

const AUTO_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

interface DashboardProps {
  state: ClientState;
  onRefreshQuotas: () => Promise<void>;
  onUseCredit: () => void;
  onSelectAccountForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
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
  onUpdateAlias
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

  // Low quota accounts (< 15% remaining on primary window)
  const lowQuotaAccounts = state.accounts.filter((acc) => {
    const snap = state.snapshots.find((s) => s.accountId === acc.id);
    const primary = snap?.windows[0];
    if (!primary) return false;
    return (primary.remainingFraction ?? 1) < 0.15;
  });

  const accountsByProvider = filteredProviders.map((p) => ({
    provider: p,
    accounts: state.accounts.filter((a) => a.providerId === p.id)
  }));

  const totalAccounts = state.accounts.length;
  const burnCount = state.snapshots.filter((s) => s.recommendation === 'burn').length;

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
              const pct = Math.round((snap?.windows[0]?.remainingFraction ?? 0) * 100);
              const name = a.displayAlias.split('•')[0].split('(')[0].trim();
              return `${name} (${pct}% left)`;
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

        <div className="flex items-center space-x-2">
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
      </div>

      {/* Quick Provider Filter Tabs */}
      <div className="flex items-center space-x-2 mb-5 overflow-x-auto pb-1">
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
              return (snap?.windows[0]?.remainingFraction ?? 1) < 0.15;
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

      {/* Provider & Account Cards Grid */}
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
    </div>
  );
};
