import React from 'react';
import { RefreshCw, ShieldCheck, Cpu, HardDrive, Flame } from 'lucide-react';
import type { Account, ClientState } from '../state/clientService.js';
import { TopAlertBanner } from '../components/TopAlertBanner.js';
import { QuotaCard } from '../components/QuotaCard.js';
import { QUOTA_RANGES } from '../utils/quotaRanger.js';

interface DashboardProps {
  state: ClientState;
  onRefreshQuotas: () => void;
  onUseCredit: () => void;
  onSelectAccountForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  onRefreshQuotas,
  onUseCredit,
  onSelectAccountForJob,
  onUpdateAlias
}) => {
  const accountsByProvider = state.providers.map((p) => ({
    provider: p,
    accounts: state.accounts.filter((a) => a.providerId === p.id)
  }));

  const totalAccounts = state.accounts.length;
  const burnCount = state.snapshots.filter((s) => s.recommendation === 'burn').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Banner Recommendation */}
      <TopAlertBanner suggestion={state.suggestion} onUseCredit={onUseCredit} />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
      <div className="mb-8 p-3.5 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="heading-500 text-xl font-medium tracking-tight text-[var(--text-main)]">
            AI Coding Accounts & Quota Windows
          </h2>
          <p className="paragraph-300 text-xs mt-0.5 font-light text-[var(--text-main)] opacity-70">
            Real-time capacity tracking across all configured providers. Multiple accounts per provider supported.
          </p>
        </div>

        <button
          onClick={onRefreshQuotas}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--text-main)] border border-slate-300 dark:border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Quotas</span>
        </button>
      </div>

      {/* Provider & Account Cards Grid */}
      <div className="space-y-8">
        {accountsByProvider.map(({ provider, accounts }) => (
          <div key={provider.id} className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-medium tracking-wider uppercase text-[var(--text-main)] opacity-80">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{provider.displayName}</span>
              <span className="opacity-50">({accounts.length} accounts)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {accounts.map((account) => {
                const snapshot = state.snapshots.find((s) => s.accountId === account.id);
                const isWide = provider.id === 'antigravity' || (snapshot?.modelGroups && snapshot.modelGroups.length > 0);
                return (
                  <div key={account.id} className={isWide ? 'col-span-1 md:col-span-2' : ''}>
                    <QuotaCard
                      account={account}
                      provider={provider}
                      snapshot={snapshot}
                      onSelectForJob={onSelectAccountForJob}
                      onUpdateAlias={onUpdateAlias}
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
