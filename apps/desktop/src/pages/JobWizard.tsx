import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  GitBranch,
  Check,
  XCircle,
  ChevronUp,
  ChevronDown,
  Layers,
  Shield,
  ShieldCheck,
  Plus
} from 'lucide-react';

import type { Account, ClientState } from '../state/clientService.js';
import { getQuotaRangeTier } from '../utils/quotaRanger.js';

interface JobWizardProps {
  state: ClientState;
  initialAccount?: Account | null;
  onCancel: () => void;
  onLaunchJob: (jobId: string) => void;
  clientService: any;
}

export const JobWizard: React.FC<JobWizardProps> = ({
  state,
  initialAccount,
  onCancel,
  onLaunchJob,
  clientService
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Form State
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [objective, setObjective] = useState(
    'Investigate architecture, dependencies, and identify potential modernization tasks'
  );
  const [depth, setDepth] = useState<'shallow' | 'standard' | 'deep'>('standard');
  const [runTests, setRunTests] = useState(true);
  const [generateFixes, setGenerateFixes] = useState(false);

  // Account Pool State
  const eligibleAccounts = state.accounts.filter((a) => a.capabilities.executeJobs);
  const defaultAccount =
    initialAccount ||
    eligibleAccounts.find((a) => a.id === state.suggestion?.recommendedAccountId) ||
    eligibleAccounts[0];

  // Ordered list of selected account IDs (index 0 is primary, followed by backups)
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    defaultAccount ? [defaultAccount.id] : []
  );

  // Preflight & Authorization
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [preflightResults, setPreflightResults] = useState<Array<{ name: string; ok: boolean; message: string }>>([]);
  const [preflightPassed, setPreflightPassed] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  const selectedAccounts = selectedAccountIds
    .map((id) => state.accounts.find((a) => a.id === id))
    .filter(Boolean) as Account[];
  const primaryAccount = selectedAccounts[0];

  const toggleAccountSelection = (accountId: string) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(accountId)) {
        if (prev.length === 1) return prev; // Keep at least one
        return prev.filter((id) => id !== accountId);
      }
      return [...prev, accountId];
    });
  };

  const movePriority = (index: number, direction: 'up' | 'down') => {
    setSelectedAccountIds((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const selectAllProviderAccounts = (providerId: string) => {
    const providerAccIds = eligibleAccounts.filter((a) => a.providerId === providerId).map((a) => a.id);
    setSelectedAccountIds((prev) => {
      const allSelected = providerAccIds.every((id) => prev.includes(id));
      if (allSelected) {
        const remaining = prev.filter((id) => !providerAccIds.includes(id));
        return remaining.length > 0 ? remaining : prev;
      }
      const combined = [...prev];
      for (const id of providerAccIds) {
        if (!combined.includes(id)) combined.push(id);
      }
      return combined;
    });
  };

  const selectAllEligibleAccounts = () => {
    setSelectedAccountIds(eligibleAccounts.map((a) => a.id));
  };

  const resetToPrimaryOnly = () => {
    const primary = defaultAccount || eligibleAccounts[0];
    if (primary) {
      setSelectedAccountIds([primary.id]);
    }
  };

  // Step 5: Trigger Preflight
  const handleProceedToPreflight = () => {
    try {
      if (selectedAccounts.length === 0) {
        throw new Error('Please select at least one account for the execution pool.');
      }
      setPreflightError(null);

      const accountPool = selectedAccounts.map((acc, idx) => ({
        accountId: acc.id,
        providerId: acc.providerId,
        displayAlias: acc.displayAlias,
        priority: idx + 1,
        status: idx === 0 ? ('active' as const) : ('standby' as const)
      }));

      const job = clientService.createRepoLabJob({
        repoUrl,
        objective,
        depth,
        runTests,
        generateFixes,
        providerId: primaryAccount.providerId,
        accountId: primaryAccount.id,
        accountPool
      });

      setCreatedJobId(job.id);
      const res = clientService.runPreflight(job.id);
      setPreflightResults(res.checks);
      setPreflightPassed(res.ok);
      setStep(5);
    } catch (err: any) {
      setPreflightError(err.message || 'Validation failed');
    }
  };


  // Step 6: Authorize & Run Job
  const handleFinalRunJob = () => {
    if (!createdJobId) return;
    clientService.authorizeJob(createdJobId);
    onLaunchJob(createdJobId);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Wizard Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">STEP {step} OF 6</span>
          <span className="heading-500 text-blue-600 dark:text-blue-400 font-medium">
            {step === 1 && 'Select Job Type'}
            {step === 2 && 'Configure Repository'}
            {step === 3 && 'Which Accounts to Use'}
            {step === 4 && 'Security & Budget'}
            {step === 5 && 'Preflight Verification'}
            {step === 6 && 'Human Authorization'}
          </span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm dark:shadow-2xl">
        {/* STEP 1: Choose Job Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">Choose Productive Job</h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Select a structured task designed to safely convert excess AI quota into useful R&D output.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border-2 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    <h3 className="heading-500 font-medium text-[var(--text-main)]">Repo Lab</h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-700">
                    Recommended
                  </span>
                </div>
                <p className="paragraph-300 text-xs leading-relaxed font-light text-[var(--text-main)] opacity-80">
                  Safely clones, builds, and inspects an unknown public GitHub repository inside an isolated disposable sandbox.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="heading-500 font-medium text-[var(--text-main)] opacity-60">Website Study</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[var(--text-main)] opacity-60">
                    Phase 6
                  </span>
                </div>
                <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-60">
                  Deterministic browser inspection and responsive screenshots with Playwright.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Configure Repository */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">Configure Repo Lab</h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Specify the public GitHub repository and evaluation objective.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase paragraph-300 font-light text-[var(--text-main)] opacity-70 mb-1.5">
                  Public GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-[var(--text-main)] focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="paragraph-300 text-xs mt-1 font-light text-[var(--text-main)] opacity-60">
                  Only public repositories are permitted in V1. Private repositories and credentials are never accessed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase paragraph-300 font-light text-[var(--text-main)] opacity-70 mb-1.5">
                  Task Objective
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-light text-[var(--text-main)] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['shallow', 'standard', 'deep'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium uppercase tracking-wider transition cursor-pointer ${
                      depth === d
                        ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[var(--text-main)] opacity-70 hover:opacity-100'
                    }`}
                  >
                    {d} Analysis
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-sm paragraph-300 font-light text-[var(--text-main)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={runTests}
                    onChange={(e) => setRunTests(e.target.checked)}
                    className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Run automated tests inside sandbox</span>
                </label>

                <label className="flex items-center space-x-2 text-sm paragraph-300 font-light text-[var(--text-main)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateFixes}
                    onChange={(e) => setGenerateFixes(e.target.checked)}
                    className="rounded bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Generate code improvement patch</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                <span>Select Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Multi-Account & Failover Pool Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-700">
                    Which Accounts to Use
                  </span>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800">
                    Failover Cascade
                  </span>
                </div>
                <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                  Assign Accounts &amp; Failover Sequence
                </h2>
                <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                  Select which accounts will fund this job. If the primary account runs out of quota or hits rate limits, execution transfers automatically down the cascade.
                </p>
              </div>

              {/* Quick Actions & Provider Filters */}
              <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={selectAllEligibleAccounts}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-[var(--text-main)] transition cursor-pointer"
                  title="Include all eligible accounts in pool"
                >
                  Select All ({eligibleAccounts.length})
                </button>
                <button
                  type="button"
                  onClick={resetToPrimaryOnly}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 text-[var(--text-main)] opacity-80 hover:opacity-100 transition cursor-pointer"
                  title="Reset to only primary account"
                >
                  Primary Only
                </button>
                {Array.from(new Set(eligibleAccounts.map((a) => a.providerId))).map((pId) => {
                  const providerAccounts = eligibleAccounts.filter((a) => a.providerId === pId);
                  const isAllSelected = providerAccounts.every((a) => selectedAccountIds.includes(a.id));
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => selectAllProviderAccounts(pId)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                        isAllSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      {isAllSelected ? `✓ ${pId.toUpperCase()}` : `+ ${pId.toUpperCase()}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Execution Cascade Summary */}
            {selectedAccounts.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span className="font-medium text-[var(--text-main)] opacity-75">
                    EXECUTION ORDER ({selectedAccounts.length} in Pool):
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                    Use ↑/↓ to reorder priority
                  </span>
                </div>

                <div className="space-y-1.5">
                  {selectedAccounts.map((account, index) => {
                    const isPrimary = index === 0;
                    return (
                      <div
                        key={account.id}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                          isPrimary
                            ? 'bg-blue-500/10 border-blue-500/40 text-[var(--text-main)]'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[var(--text-main)] opacity-85'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                              isPrimary
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isPrimary ? 'PRIMARY' : `BACKUP ${index}`}
                          </span>
                          <span className="font-medium truncate">{account.displayAlias}</span>
                          <span className="text-[10px] font-mono opacity-50 uppercase">
                            ({account.providerId})
                          </span>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => movePriority(index, 'up')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Move up priority"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === selectedAccounts.length - 1}
                            onClick={() => movePriority(index, 'down')}
                            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                            title="Move down priority"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Account Selection Checkboxes */}
            <div className="space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-1">
                Available Accounts (Check to include in Failover Pool)
              </div>

              {eligibleAccounts.map((account) => {
                const snapshot = state.snapshots.find((s) => s.accountId === account.id);
                const isSelected = selectedAccountIds.includes(account.id);
                const priorityIndex = selectedAccountIds.indexOf(account.id);
                const isRecommended = account.id === state.suggestion?.recommendedAccountId;
                const remPercent =
                  snapshot?.windows[0]?.remainingFraction !== undefined &&
                  snapshot?.windows[0]?.remainingFraction !== null
                    ? Math.round(snapshot.windows[0].remainingFraction * 100)
                    : null;
                const tier = remPercent !== null ? getQuotaRangeTier(remPercent) : null;

                return (
                  <div
                    key={account.id}
                    onClick={() => toggleAccountSelection(account.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/10'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="heading-500 font-medium text-sm text-[var(--text-main)] truncate">
                            {account.displayAlias}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-300 font-medium shrink-0">
                              #{priorityIndex + 1}
                            </span>
                          )}
                          {isRecommended && (
                            <span className="text-[10px] font-medium uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-500/30 shrink-0">
                              🔥 USE SOON
                            </span>
                          )}
                          {tier && (
                            <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder} shrink-0`}>
                              {tier.label}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono paragraph-300 font-light text-[var(--text-main)] opacity-70">
                          {remPercent !== null ? `${remPercent}% quota remaining` : 'Active account'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70 shrink-0 ml-2">
                      {account.providerId.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reserved / Protected Accounts Section */}
            {(() => {
              const reservedAccounts = state.accounts.filter((a) => !selectedAccountIds.includes(a.id));
              if (reservedAccounts.length === 0) return null;
              return (
                <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] font-medium">
                        Reserved Accounts ({reservedAccounts.length} Protected / Held Back)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Untouched by Jobs
                    </span>
                  </div>

                  <p className="text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70 mb-3">
                    These accounts will <strong>never</strong> be touched or drawn down by this job. Their quotas and rate limits remain 100% reserved for your direct interactive work.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {reservedAccounts.map((account) => {
                      const snapshot = state.snapshots.find((s) => s.accountId === account.id);
                      const remPercent =
                        snapshot?.windows[0]?.remainingFraction !== undefined &&
                        snapshot?.windows[0]?.remainingFraction !== null
                          ? Math.round(snapshot.windows[0].remainingFraction * 100)
                          : null;
                      return (
                        <div
                          key={account.id}
                          className="p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-medium text-xs text-[var(--text-main)] truncate">
                                  {account.displayAlias}
                                </span>
                                <span className="text-[9px] font-mono uppercase opacity-50">
                                  ({account.providerId})
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-[var(--text-main)] opacity-60">
                                {remPercent !== null ? `${remPercent}% quota preserved` : 'Standby account'}
                              </span>
                            </div>
                          </div>

                          {account.capabilities.executeJobs && (
                            <button
                              type="button"
                              onClick={() => toggleAccountSelection(account.id)}
                              className="flex items-center space-x-1 px-2 py-1 rounded text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/60 transition cursor-pointer shrink-0"
                              title="Add to failover pool"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Pool</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                disabled={selectedAccounts.length === 0}
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition cursor-pointer"
              >
                <span>Security Review ({selectedAccounts.length} in Pool)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        {/* STEP 4: Security Profile */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">Balanced Sandbox Profile</h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Hard isolation boundaries enforced before any container starts.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-900">
                <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Filesystem Isolation</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Zero Host Directory Mounts</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-900">
                <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Docker Socket Access</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Disabled (No DinD)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-900">
                <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Network Policy</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-medium">Public Web Only (No LAN / Localhost)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-200 dark:border-slate-900">
                <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Resource Limits</span>
                <span className="font-mono font-medium text-[var(--text-main)]">2 CPU Cores / 2048 MB RAM</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">Process User</span>
                <span className="font-mono font-medium text-[var(--text-main)]">Unprivileged (UID 1000)</span>
              </div>
            </div>

            {preflightError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{preflightError}</span>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleProceedToPreflight}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                <span>Run Preflight Checks</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Preflight Review */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
                  Pre-Run Safety Guarantee
                </span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">Preflight Verification</h2>
              <p className="paragraph-300 text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                Nothing has executed yet. All checks below are purely non-executing static validations.
              </p>
            </div>

            <div className="space-y-3">
              {preflightResults.map((check, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start justify-between"
                >
                  <div className="flex items-start space-x-3">
                    {check.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="heading-500 font-medium text-sm text-[var(--text-main)]">{check.name}</p>
                      <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-70 mt-0.5">{check.message}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">PASS</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                disabled={!preflightPassed}
                onClick={() => setStep(6)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition cursor-pointer"
              >
                <span>Proceed to Final Authorization</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: Final Human Authorization (RUN JOB) */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-4">
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="heading-500 font-medium text-base uppercase tracking-wider font-mono">
                  Final Human Authorization Required
                </h3>
              </div>

              <div className="space-y-2 text-sm paragraph-300 font-light text-[var(--text-main)]">
                <p>
                  You are about to execute an isolated R&D evaluation of{' '}
                  <strong className="font-medium font-mono">{repoUrl}</strong> funded by{' '}
                  <strong className="font-medium text-amber-600 dark:text-amber-300">{primaryAccount?.displayAlias}</strong>
                  {selectedAccounts.length > 1 && (
                    <span>
                      {' '}with automatic failover across {selectedAccounts.length - 1} backup account(s):{' '}
                      <span className="font-mono text-xs opacity-80">
                        {selectedAccounts.slice(1).map((a) => a.displayAlias).join(', ')}
                      </span>
                    </span>
                  )}
                  .
                </p>
                <p className="text-xs leading-relaxed bg-white dark:bg-slate-950/80 p-3 rounded-xl border border-amber-200 dark:border-slate-800">
                  🛡️ <strong>Sandbox Safety Statement:</strong> Unknown code may execute inside an isolated sandbox. It cannot access your normal files, SSH keys, or private repositories.
                </p>
              </div>


              <div className="pt-2">
                <button
                  onClick={handleFinalRunJob}
                  className="w-full py-4 rounded-xl text-base font-medium uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition transform active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>RUN JOB</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70">
              <button
                onClick={() => setStep(5)}
                className="flex items-center space-x-1 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Review</span>
              </button>
              <span>Hash-bound ExecutionIntent will be persisted on click.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
