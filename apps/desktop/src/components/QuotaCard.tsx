import React, { useState } from 'react';
import { Clock, Play, Edit3, Check, Flame, ShieldAlert, ChevronDown, ChevronUp, Layers, Info, Mail, AlertCircle, Gift } from 'lucide-react';
import type { Account, AccountQuotaSnapshot, Provider } from '@tokenpilot/contracts';
import { getQuotaRangeTier } from '../utils/quotaRanger.js';
import { useCountdown } from '../hooks/useCountdown.js';

interface QuotaCardProps {
  account: Account;
  provider: Provider;
  snapshot?: AccountQuotaSnapshot;
  onSelectForJob: (account: Account) => void;
  onUpdateAlias: (accountId: string, newAlias: string) => void;
  onRefresh?: () => void;
}


const ProgressRing: React.FC<{ percentage: number; size?: number; strokeWidth?: number }> = ({
  percentage,
  size = 20,
  strokeWidth = 2.5
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;
  const tier = getQuotaRangeTier(percentage);

  return (
    <svg width={size} height={size} className="transform -rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-800"
        fill="transparent"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={tier.strokeHex}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
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
  onUpdateAlias,
  onRefresh
}) => {
  const [isEditingAlias, setIsEditingAlias] = useState(false);
  const [aliasInput, setAliasInput] = useState(account.displayAlias);
  const [showModelBreakdown, setShowModelBreakdown] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.8-flash-medium');
  const [imgError, setImgError] = useState(false);

  const primaryWindow = snapshot?.windows[0];
  const remainingPercent = primaryWindow?.remainingFraction !== null && primaryWindow?.remainingFraction !== undefined
    ? Math.round(primaryWindow.remainingFraction * 100)
    : null;

  // Live countdown to reset time with auto-refresh on 0:00 expiry
  const countdown = useCountdown(primaryWindow?.resetsAt, onRefresh);


  const rangerTier = remainingPercent !== null ? getQuotaRangeTier(remainingPercent) : null;
  const isBurn = snapshot?.recommendation === 'burn';
  const isConserve = snapshot?.recommendation === 'conserve';
  const hasModelGroups = snapshot?.modelGroups && snapshot.modelGroups.length > 0;
  const isLowQuota = remainingPercent !== null && remainingPercent < 15;

  // Codex reset credit badge
  const resetCredit = (account as any)._resetCreditCount as number | undefined;

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

  // Derive human name, email, and distinct initials for clear account recognition
  const emailMatch = account.displayAlias.match(/\(([^)]+@.+)\)/);
  const email = emailMatch ? emailMatch[1] : account.upstreamIdentities?.find((id) => id.includes('@'));
  const rawDisplayName = emailMatch
    ? account.displayAlias.replace(/\s*\([^)]+@.+\)/, '').trim()
    : account.displayAlias;

  const personName = rawDisplayName.includes('•') ? rawDisplayName.split('•')[0].trim() : rawDisplayName;
  const initials = (() => {
    const clean = personName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return email ? email.slice(0, 2).toUpperCase() : 'AI';
  })();

  const avatarGradient = provider.id === 'warp'
    ? 'from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700'
    : provider.id === 'codex'
    ? 'from-violet-500 to-purple-600 dark:from-violet-600 dark:to-purple-700'
    : provider.id === 'opencode'
    ? 'from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700'
    : 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700';

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 shadow-sm dark:shadow-md ${
      isLowQuota
        ? 'border-rose-300 dark:border-rose-700 ring-1 ring-rose-200 dark:ring-rose-800'
        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
    }`}>
      <div>
        {/* Header: Visual Avatar, Provider & Account Identity */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start space-x-3 min-w-0">
            {/* Visual Avatar with account initials or photo */}
            {account.photoUrl && !imgError ? (
              <img
                src={account.photoUrl}
                alt={initials}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 mt-0.5"
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${avatarGradient} text-white flex items-center justify-center font-medium text-xs shadow-xs shrink-0 mt-0.5 select-none`}>
                {initials}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] uppercase font-mono tracking-wider font-light text-[var(--text-main)] opacity-70">
                  {provider.displayName}
                </span>
                {snapshot?.freshness === 'fresh' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 font-mono font-medium">
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
                    className="bg-slate-50 dark:bg-slate-950 border border-blue-500 rounded px-2 py-0.5 text-sm font-medium text-[var(--text-main)] focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveAlias}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    title="Save custom name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 mt-0.5 group">
                  <h3 className="heading-500 text-base tracking-tight font-medium text-[var(--text-main)] truncate" title={account.displayAlias}>
                    {rawDisplayName}
                  </h3>
                  <button
                    onClick={() => setIsEditingAlias(true)}
                    className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer shrink-0"
                    title="Rename account alias"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Verified Account Email pill */}
              {email && (
                <div className="flex items-center space-x-1.5 mt-0.5 text-xs font-mono font-light text-[var(--text-main)] opacity-75">
                  <Mail className="w-3 h-3 opacity-60 shrink-0" />
                  <span className="truncate max-w-[210px]" title={email}>{email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recommendation Badge + Credit Badge */}
          <div className="flex items-center space-x-1.5 shrink-0 flex-wrap gap-y-1">
            {isLowQuota && !isBurn && !isConserve && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span>Low</span>
              </span>
            )}
            {isBurn && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Flame className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>Burn</span>
              </span>
            )}
            {isConserve && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <ShieldAlert className="w-3 h-3 text-rose-500" />
                <span>Conserve</span>
              </span>
            )}
            {resetCredit !== undefined && resetCredit > 0 && (
              <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/30" title="Free rate limit reset available">
                <Gift className="w-3 h-3 text-violet-500" />
                <span>{resetCredit} Reset{resetCredit > 1 ? 's' : ''}</span>
              </span>
            )}
          </div>
        </div>

        {/* Quota Progress with Ranger System */}
        {remainingPercent !== null && rangerTier ? (
          <div className="space-y-2 mb-4">
            <div className="flex items-baseline justify-between text-xs">
              <span className="paragraph-300 font-light text-[var(--text-main)]">Primary Quota Allowance</span>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${rangerTier.badgeBg} ${rangerTier.badgeText} ${rangerTier.badgeBorder}`}>
                  {rangerTier.label}
                </span>
                <span className={`font-mono text-sm font-medium ${rangerTier.textClass}`}>
                  {remainingPercent}%
                </span>
              </div>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${rangerTier.gradientClass}`}
                style={{ width: `${remainingPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="paragraph-300 text-xs italic mb-4 font-light text-[var(--text-main)] opacity-70">
            Quota percentage not reported
          </div>
        )}

        {/* In-Editor Credit Usage Breakdown (Google Antigravity & Multi-model groups) */}
        {(hasModelGroups || provider.id === 'antigravity') && (
          <div className="mb-4">
            {/* Compact Model Group Preview when collapsed */}
            {hasModelGroups && !showModelBreakdown && (
              <div className="grid grid-cols-2 gap-2 mb-2.5">
                {snapshot?.modelGroups?.map((group, idx) => {
                  const percent = group.weeklyLimitRemaining;
                  const tier = getQuotaRangeTier(percent);
                  const isGemini = group.groupName.toLowerCase().includes('gemini');
                  return (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="truncate opacity-75 font-light">{isGemini ? 'Gemini Models' : 'Claude & GPT'}</span>
                        <span className={`font-mono text-xs font-medium ${tier.textClass}`}>{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden mb-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${tier.gradientClass}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] opacity-60 font-light truncate" title={group.weeklyResetTime}>
                        {group.weeklyResetTime}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setShowModelBreakdown(!showModelBreakdown)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 hover:bg-slate-100 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs font-light text-[var(--text-main)] transition cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Layers className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                <span className="heading-500 font-medium text-[var(--text-main)]">
                  {showModelBreakdown ? 'Hide Model Breakdown' : `View 33 Models & Limits`}
                </span>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 font-medium">
                  Live
                </span>
              </div>
              {showModelBreakdown ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showModelBreakdown && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-stone-900/95 border border-slate-200 dark:border-stone-800 text-[var(--text-main)] shadow-inner">
                {/* Two-Pane Layout matching the Antigravity in-editor UI */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Left Column: Models List */}
                  <div className="md:col-span-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-stone-800 pb-3 md:pb-0 md:pr-3">
                    <div className="heading-500 text-[11px] font-medium uppercase tracking-wider mb-2 text-[var(--text-main)] opacity-70">
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
                                ? 'bg-white dark:bg-stone-800/90 text-[var(--text-main)] font-medium border border-slate-300 dark:border-stone-700/60 shadow-xs'
                                : 'hover:bg-slate-100 dark:hover:bg-stone-800/50 text-[var(--text-main)] font-light opacity-90'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[10px] opacity-60">{m.tier}</span>
                              {m.isFast && (
                                <span className="inline-flex items-center space-x-0.5 text-[9px] px-1 py-0.2 bg-slate-200/80 dark:bg-stone-800 text-[var(--text-main)] rounded border border-slate-300 dark:border-stone-700">
                                  <span>Fast</span>
                                  <Info className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                                </span>
                              )}
                            </div>
                            <div className="shrink-0 text-slate-400 text-xs">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-blue-500 dark:text-stone-200" /> : '›'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Exact Limit Breakdown with Ranger Rings */}
                  <div className="md:col-span-6 space-y-3.5 pl-1">
                    {/* Gemini Models Section */}
                    <div>
                      <div className="heading-500 text-xs font-medium text-[var(--text-main)] mb-2">
                        Gemini Models
                      </div>
                      <div className="space-y-2">
                        {/* Weekly Limit */}
                        {(() => {
                          const percent = snapshot?.modelGroups?.[0]?.weeklyLimitRemaining ?? 78;
                          const tier = getQuotaRangeTier(percent);
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <div className="paragraph-300 font-light text-[var(--text-main)]">Weekly Limit Remaining</div>
                                <div className="paragraph-300 text-[11px] font-light text-[var(--text-main)] opacity-70">
                                  {snapshot?.modelGroups?.[0]?.weeklyResetTime || 'Resets in 45m'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-medium text-sm ${tier.textClass}`}>
                                  {percent}%
                                </span>
                                <ProgressRing percentage={percent} size={20} strokeWidth={2.5} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Five Hour Limit */}
                        {(() => {
                          const percent = snapshot?.modelGroups?.[0]?.fiveHourLimitRemaining ?? 100;
                          const tier = getQuotaRangeTier(percent);
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <div className="paragraph-300 font-light text-[var(--text-main)]">Five Hour Limit Remaining</div>
                                <div className="paragraph-300 text-[11px] font-light text-[var(--text-main)] opacity-70">
                                  {snapshot?.modelGroups?.[0]?.fiveHourResetTime || 'Resets in 4h 54m'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-medium text-sm ${tier.textClass}`}>
                                  {percent}%
                                </span>
                                <ProgressRing percentage={percent} size={20} strokeWidth={2.5} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 dark:border-stone-800 pt-3">
                      {/* Claude and GPT Models Section */}
                      <div className="heading-500 text-xs font-medium text-[var(--text-main)] mb-2">
                        Claude and GPT models
                      </div>
                      <div className="space-y-2">
                        {/* Weekly Limit */}
                        {(() => {
                          const percent = snapshot?.modelGroups?.[1]?.weeklyLimitRemaining ?? 67;
                          const tier = getQuotaRangeTier(percent);
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <div className="paragraph-300 font-light text-[var(--text-main)]">Weekly Limit Remaining</div>
                                <div className="paragraph-300 text-[11px] font-light text-[var(--text-main)] opacity-70">
                                  {snapshot?.modelGroups?.[1]?.weeklyResetTime || 'Resets in 6d 5h'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-medium text-sm ${tier.textClass}`}>
                                  {percent}%
                                </span>
                                <ProgressRing percentage={percent} size={20} strokeWidth={2.5} />
                              </div>
                            </div>
                          );
                        })()}

                        {/* Five Hour Limit */}
                        {(() => {
                          const percent = snapshot?.modelGroups?.[1]?.fiveHourLimitRemaining ?? 100;
                          const tier = getQuotaRangeTier(percent);
                          return (
                            <div className="flex items-center justify-between text-xs">
                              <div>
                                <div className="paragraph-300 font-light text-[var(--text-main)]">Five Hour Limit Remaining</div>
                                <div className="paragraph-300 text-[11px] font-light text-[var(--text-main)] opacity-70">
                                  {snapshot?.modelGroups?.[1]?.fiveHourResetTime || 'Standard'}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-mono font-medium text-sm ${tier.textClass}`}>
                                  {percent}%
                                </span>
                                <ProgressRing percentage={percent} size={20} strokeWidth={2.5} />
                              </div>
                            </div>
                          );
                        })()}
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
          <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60 text-xs">
            {snapshot.windows.map((win) => {
              const winPercent = win.remainingFraction !== null ? Math.round(win.remainingFraction * 100) : null;
              const winTier = winPercent !== null ? getQuotaRangeTier(winPercent) : null;
              const winResetLabel = (win as any).resetLabel as string | null;
              return (
                <div key={win.id} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="paragraph-300 font-light text-[var(--text-main)] truncate">{win.label}</span>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {winTier && (
                        <span className={`w-1.5 h-1.5 rounded-full ${winTier.dotColor}`}></span>
                      )}
                      <span className="font-mono font-medium text-[var(--text-main)]">
                        {(win as any).remainingLabel ? (win as any).remainingLabel : winPercent !== null ? `${winPercent}% left` : 'Active'}
                      </span>
                    </div>
                  </div>
                  {winResetLabel && (
                    <div className="text-[10px] font-mono opacity-55 text-[var(--text-main)] pl-0.5">
                      {winResetLabel}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Reset Countdown — live ticking or static label */}
        {(primaryWindow?.resetsAt || (primaryWindow as any)?.resetLabel) && (
          <div className="flex items-center space-x-1.5 text-xs mb-4">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="paragraph-300 font-light text-[var(--text-main)]">
              {countdown ? (
                <>
                  Resets in{' '}
                  <strong className="font-medium text-[var(--text-main)] font-mono">{countdown}</strong>
                </>
              ) : (primaryWindow as any)?.resetLabel ? (
                <span className="font-medium text-[var(--text-main)] font-mono">
                  {(primaryWindow as any).resetLabel}
                </span>
              ) : (
                <>
                  Resets in{' '}
                  <strong className="font-medium text-[var(--text-main)] font-mono">
                    {Math.max(1, Math.round((new Date(primaryWindow!.resetsAt!).getTime() - Date.now()) / (1000 * 3600)))}h
                  </strong>
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Footer: Capabilities & Action Button */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5 text-[10px] font-mono font-medium">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[var(--text-main)] border border-slate-200 dark:border-slate-700/60">
            TRACK ✓
          </span>
          <span className={`px-1.5 py-0.5 rounded ${
            account.capabilities.executeJobs
              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
              : 'bg-slate-100 dark:bg-slate-800/50 text-[var(--text-main)] opacity-50'
          }`}>
            {account.capabilities.executeJobs ? 'RUN ✓' : 'RUN —'}
          </span>
        </div>

        {account.capabilities.executeJobs ? (
          <button
            onClick={() => onSelectForJob(account)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Run Job</span>
          </button>
        ) : (
          <span className="paragraph-300 text-[11px] font-light text-[var(--text-main)] opacity-60 italic">Monitor Only</span>
        )}
      </div>
    </div>
  );
};
