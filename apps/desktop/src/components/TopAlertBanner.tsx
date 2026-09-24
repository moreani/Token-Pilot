import React from 'react';
import { Flame, ArrowRight, Clock } from 'lucide-react';
import type { QuotaSuggestion } from '@tokenpilot/contracts';
import { getQuotaRangeTier } from '../utils/quotaRanger.js';

interface TopAlertBannerProps {
  suggestion: QuotaSuggestion | null;
  onUseCredit: () => void;
}

export const TopAlertBanner: React.FC<TopAlertBannerProps> = ({ suggestion, onUseCredit }) => {
  if (!suggestion) return null;

  const remainingPercent = Math.round(suggestion.remainingFraction * 100);
  const tier = getQuotaRangeTier(remainingPercent);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/60 dark:via-slate-900 dark:to-slate-900 border border-amber-300 dark:border-amber-600/40 p-6 shadow-md dark:shadow-xl mb-8">
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>USE SOON</span>
            </span>
            <span className="text-xs flex items-center space-x-1 paragraph-300 font-light text-[var(--text-main)] opacity-70">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Resets in {suggestion.resetsInHours}h</span>
            </span>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}>
              {tier.label} ({remainingPercent}%)
            </span>
          </div>

          <div>
            <h2 className="heading-500 text-2xl font-medium tracking-tight flex items-center space-x-3 text-[var(--text-main)]">
              <span>{suggestion.accountAlias}</span>
              <span className={`font-mono text-xl font-medium ${tier.textClass}`}>
                ({remainingPercent}% remaining)
              </span>
            </h2>
            <p className="paragraph-300 text-sm mt-1 max-w-2xl leading-relaxed font-light text-[var(--text-main)]">
              {suggestion.reason} Unused quota will be permanently forfeited upon reset. Run an isolated R&D evaluation now to turn excess capacity into useful work.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
          <button
            onClick={onUseCredit}
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <span>USE MY CREDIT</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
