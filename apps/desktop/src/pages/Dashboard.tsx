import React from 'react';
import { RefreshCw, ShieldCheck, Cpu, HardDrive, CheckCircle, Flame } from 'lucide-react';
import type { Account, ClientState } from '../state/clientService.js';
import { TopAlertBanner } from '../components/TopAlertBanner.js';
import { QuotaCard } from '../components/QuotaCard.js';

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
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Monitored Accounts</span>
          </div>
          <p className="text-2xl font-bold font-mono text-white mt-1">{totalAccounts}</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>At-Risk Quotas</span>
          </div>
          <p className="text-2xl font-bold font-mono text-amber-400 mt-1">{burnCount} Burn Alerts</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sandbox Isolation</span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">Balanced Profile</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>Local Storage</span>
          </div>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">SQLite Encrypted</p>
        </div>
      </div>

      {/* Dashboard Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">AI Coding Accounts & Quota Windows</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time capacity tracking across all configured providers. Multiple accounts per provider supported.
          </p>
        </div>

        <button
          onClick={onRefreshQuotas}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Quotas</span>
        </button>
      </div>

      {/* Provider & Account Cards Grid */}
      <div className="space-y-8">
        {accountsByProvider.map(({ provider, accounts }) => (
          <div key={provider.id} className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>{provider.displayName}</span>
              <span className="text-slate-600">({accounts.length} accounts)</span>
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
