import React, { useState } from 'react';
import { Clock, Play, Edit3, Check, Flame, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Account, AccountQuotaSnapshot, Provider } from '@tokenpilot/contracts';

interface QuotaCardProps {
  account: Account;
  provider: Provider;
  snapshot?: AccountQuotaSnapshot;
  onSelectForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
}

export const QuotaCard: React.FC<QuotaCardProps> = ({
  account,
  provider,
  snapshot,
  onSelectForJob,
  onUpdateAlias
}) => {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(account.displayAlias);

  const primaryWindow = snapshot?.windows[0];
  const remainingPercent = primaryWindow?.remainingFraction !== null && primaryWindow?.remainingFraction !== undefined
    ? Math.round(primaryWindow.remainingFraction * 100)
    : null;

  const isBurn = snapshot?.recommendation === 'burn';
  const isConserve = snapshot?.recommendation === 'conserve';

  const handleSaveAlias = () => {
    if (aliasInput.trim() && aliasInput !== account.displayAlias) {
      onUpdateAlias(account.id, aliasInput.trim());
    }
    setIsEditingAlias(false);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-700 p-5 flex flex-col justify-between transition-all duration-200 shadow-md">
      <div>
        {/* Header: Provider & Account Alias */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono tracking-wider text-slate-400">
                {provider.displayName}
              </span>
              {snapshot?.freshness === 'fresh' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                  Fresh
                </span>
              )}
            </div>

            {isEditingAlias ? (
              <div className="flex items-center space-x-1.5 mt-1">
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  className="bg-slate-950 border border-blue-500 rounded px-2 py-0.5 text-sm text-white focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveAlias}
                  className="p-1 rounded hover:bg-slate-800 text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 mt-0.5 group">
                <h3 className="font-semibold text-white text-base tracking-tight">
                  {account.displayAlias}
                </h3>
                <button
                  onClick={() => setIsEditingAlias(true)}
                  className="opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Recommendation Badge */}
          {isBurn && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>Burn</span>
            </span>
          )}
          {isConserve && (
            <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>Conserve</span>
            </span>
          )}
        </div>

        {/* Quota Progress */}
        {remainingPercent !== null ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-medium">Remaining Quota</span>
              <span className={`font-mono text-sm font-bold ${
                remainingPercent > 50 ? 'text-emerald-400' : remainingPercent > 20 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {remainingPercent}%
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isBurn
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 shadow-sm shadow-amber-500/40'
                    : isConserve
                    ? 'bg-rose-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic mb-4">Quota percentage not reported</div>
        )}

        {/* Multiple Windows Breakdown */}
        {snapshot?.windows && snapshot.windows.length > 0 && (
          <div className="space-y-1.5 mb-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 text-xs">
            {snapshot.windows.map((win) => (
              <div key={win.id} className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 truncate">{win.label}</span>
                <span className="font-mono text-slate-300">
                  {win.remainingFraction !== null ? `${Math.round(win.remainingFraction * 100)}% left` : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Reset Countdown */}
        {primaryWindow?.resetsAt && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 mb-4">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>
              Resets in{' '}
              <strong className="text-slate-200 font-mono">
                {Math.max(1, Math.round((new Date(primaryWindow.resetsAt).getTime() - Date.now()) / (1000 * 3600)))}h
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Footer: Capabilities & Action Button */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono">
          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            TRACK ✓
          </span>
          <span className={`px-1.5 py-0.5 rounded ${
            account.capabilities.executeJobs
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
              : 'bg-slate-800/50 text-slate-500'
          }`}>
            {account.capabilities.executeJobs ? 'RUN ✓' : 'RUN —'}
          </span>
        </div>

        {account.capabilities.executeJobs ? (
          <button
            onClick={() => onSelectForJob(account)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Job</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 italic">Monitor Only</span>
        )}
      </div>
    </div>
  );
};
