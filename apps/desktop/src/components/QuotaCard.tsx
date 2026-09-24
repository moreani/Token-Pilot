import React, { useState } from 'react';
import { Clock, Play, Edit3, Check, Flame, ShieldAlert, ChevronDown, ChevronUp, Layers, CheckCircle2, Info } from 'lucide-react';
import type { Account, AccountQuotaSnapshot, Provider } from '@tokenpilot/contracts';

interface QuotaCardProps {
  account: Account;
  provider: Provider;
  snapshot?: AccountQuotaSnapshot;
  onSelectForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
}

const ProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 20,
  strokeWidth = 2.5
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-700/60"
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className={percentage >= 70 ? 'text-emerald-400' : percentage >= 30 ? 'text-amber-400' : 'text-rose-400'}
        fill="transparent"
      />
    </svg>
  );
};

export const QuotaCard: React.FC<QuotaCardProps> = ({
  account,
  provider,
  snapshot,
  onSelectForJob,
  onUpdateAlias
}) => {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(account.displayAlias);
  const [showModelBreakdown, setShowModelBreakdown] = useState(provider.id === 'antigravity');
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash-medium');

  const primaryWindow = snapshot?.windows[0];
  const remainingPercent = primaryWindow?.remainingFraction !== null && primaryWindow?.remainingFraction !== undefined
    ? Math.round(primaryWindow.remainingFraction * 100)
    : null;

  const isBurn = snapshot?.recommendation === 'burn';
  const isConserve = snapshot?.recommendation === 'conserve';
  const hasModelGroups = snapshot?.modelGroups && snapshot.modelGroups.length > 0;

  const handleSaveAlias = () => {
    if (aliasInput.trim() && aliasInput !== account.displayAlias) {
      onUpdateAlias(account.id, aliasInput.trim());
    }
    setIsEditingAlias(false);
  };

  const defaultAntigravityModels = [
    { id: 'gemini-3.8-flash-medium', name: 'Gemini 3.8 Flash', tier: 'Medium', speed: 'Fast', isFast: true },
    { id: 'gemini-3.7-flash-medium', name: 'Gemini 3.7 Flash', tier: 'Medium', speed: 'Fast', isFast: true },
    { id: 'gemini-3.6-flash-medium', name: 'Gemini 3.6 Flash', tier: 'Medium', speed: 'Fast', isFast: true },
    { id: 'gemini-3.1-pro-low', name: 'Gemini 3.1 Pro', tier: 'Low', speed: 'Standard', isFast: false },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6', tier: '(Thinking)', speed: 'Reasoning', isFast: false },
    { id: 'claude-opus-4-6-thinking', name: 'Claude Opus 4.6', tier: '(Thinking)', speed: 'Deep Reasoning', isFast: false },
    { id: 'gpt-oss-120b-medium', name: 'GPT-OSS 120B', tier: '(Medium)', speed: 'Standard', isFast: false }
  ];

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
                  className="p-1 rounded hover:bg-slate-800 text-emerald-400 cursor-pointer"
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
                  className="opacity-0 group-hover:opacity-100 transition text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Recommendation Badge */}
          <div className="flex items-center space-x-1.5">
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
        </div>

        {/* Quota Progress */}
        {remainingPercent !== null ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-slate-400 font-medium">Primary Quota Allowance</span>
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

        {/* In-Editor Credit Usage Breakdown (Google Antigravity & Multi-model groups) */}
        {(hasModelGroups || provider.id === 'antigravity') && (
          <div className="mb-4">
            <button
              onClick={() => setShowModelBreakdown(!showModelBreakdown)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-300 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-white font-semibold">View Usage & Models</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/30">
                  Antigravity Live
                </span>
              </div>
              {showModelBreakdown ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showModelBreakdown && (
              <div className="mt-2.5 p-3 rounded-xl bg-stone-900/95 border border-stone-800 text-stone-200 shadow-inner">
                {/* Two-Pane or Stacked Layout matching the Antigravity in-editor screenshot */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Left Column: Models List */}
                  <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-stone-800 pb-3 md:pb-0 md:pr-3">
                    <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                      Model
                    </div>
                    <div className="space-y-1">
                      {defaultAntigravityModels.map((m) => {
                        const isSelected = selectedModel === m.id;
                        return (
                          <div
                            key={m.id}
                            onClick={() => setSelectedModel(m.id)}
                            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-stone-800/90 text-white font-medium border border-stone-700/60'
                                : 'hover:bg-stone-800/50 text-stone-300'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] text-stone-400">{m.tier}</span>
                              {m.isFast && (
                                <span className="inline-flex items-center space-x-0.5 text-[9px] px-1 py-0.2 bg-stone-800 text-stone-300 rounded border border-stone-700">
                                  <span>Fast</span>
                                  <Info className="w-2.5 h-2.5 text-stone-400 ml-0.5" />
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 text-stone-400 text-xs">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-stone-200" /> : '›'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Exact Limit Breakdown from Screenshot */}
                  <div className="md:col-span-6 space-y-3.5 pl-1">
                    {/* Gemini Models Section */}
                    <div>
                      <div className="text-xs font-semibold text-stone-400 mb-2">
                        Gemini Models
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="text-stone-200 font-medium">Weekly Limit Remaining</div>
                            <div className="text-[11px] text-stone-400">
                              {snapshot?.modelGroups?.[0]?.weeklyResetTime || 'Resets in 45m'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-stone-100 text-sm">
                              {snapshot?.modelGroups?.[0]?.weeklyLimitRemaining ?? 78}%
                            </span>
                            <ProgressRing percentage={snapshot?.modelGroups?.[0]?.weeklyLimitRemaining ?? 78} size={20} strokeWidth={2.5} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="text-stone-200 font-medium">Five Hour Limit Remaining</div>
                            <div className="text-[11px] text-stone-400">
                              {snapshot?.modelGroups?.[0]?.fiveHourResetTime || 'Resets in 4h 54m'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-stone-100 text-sm">
                              {snapshot?.modelGroups?.[0]?.fiveHourLimitRemaining ?? 100}%
                            </span>
                            <ProgressRing percentage={snapshot?.modelGroups?.[0]?.fiveHourLimitRemaining ?? 100} size={20} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-stone-800 pt-3">
                      {/* Claude and GPT Models Section */}
                      <div className="text-xs font-semibold text-stone-400 mb-2">
                        Claude and GPT models
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="text-stone-200 font-medium">Weekly Limit Remaining</div>
                            <div className="text-[11px] text-stone-400">
                              {snapshot?.modelGroups?.[1]?.weeklyResetTime || 'Resets in 6d 5h'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-stone-100 text-sm">
                              {snapshot?.modelGroups?.[1]?.weeklyLimitRemaining ?? 67}%
                            </span>
                            <ProgressRing percentage={snapshot?.modelGroups?.[1]?.weeklyLimitRemaining ?? 67} size={20} strokeWidth={2.5} />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <div className="text-stone-200 font-medium">Five Hour Limit Remaining</div>
                            <div className="text-[11px] text-stone-400">
                              {snapshot?.modelGroups?.[1]?.fiveHourResetTime || 'Standard'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-stone-100 text-sm">
                              {snapshot?.modelGroups?.[1]?.fiveHourLimitRemaining ?? 100}%
                            </span>
                            <ProgressRing percentage={snapshot?.modelGroups?.[1]?.fiveHourLimitRemaining ?? 100} size={20} strokeWidth={2.5} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Windows Breakdown for standard providers */}
        {(!hasModelGroups && provider.id !== 'antigravity') && snapshot?.windows && snapshot.windows.length > 0 && (
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
