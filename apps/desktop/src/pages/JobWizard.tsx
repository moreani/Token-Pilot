import React, { useState } from 'react';
import {
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  GitBranch,
  Terminal,
  FileCheck,
  Check,
  XCircle
} from 'lucide-react';
import type { Account, ClientState } from '../state/clientService.js';
import type { RepoLabSpec } from '@tokenpilot/contracts';

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

  // Account State
  const eligibleAccounts = state.accounts.filter((a) => a.capabilities.executeJobs);
  const defaultAccount =
    initialAccount ||
    eligibleAccounts.find((a) => a.id === state.suggestion?.recommendedAccountId) ||
    eligibleAccounts[0];

  const [selectedAccountId, setSelectedAccountId] = useState<string>(defaultAccount?.id || '');

  // Preflight & Authorization
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [preflightResults, setPreflightResults] = useState<Array<{ name: string; ok: boolean; message: string }>>([]);
  const [preflightPassed, setPreflightPassed] = useState(false);
  const [preflightError, setPreflightError] = useState<string | null>(null);

  const selectedAccount = state.accounts.find((a) => a.id === selectedAccountId);
  const selectedProvider = state.providers.find((p) => p.id === selectedAccount?.providerId);

  // Step 5: Trigger Preflight
  const handleProceedToPreflight = () => {
    try {
      setPreflightError(null);
      const job = clientService.createRepoLabJob({
        repoUrl,
        objective,
        depth,
        runTests,
        generateFixes,
        providerId: selectedAccount!.providerId,
        accountId: selectedAccountId
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
          <span className="text-slate-400">STEP {step} OF 6</span>
          <span className="text-blue-400 font-bold">
            {step === 1 && 'Select Job Type'}
            {step === 2 && 'Configure Repository'}
            {step === 3 && 'Assign Account'}
            {step === 4 && 'Security & Budget'}
            {step === 5 && 'Preflight Verification'}
            {step === 6 && 'Human Authorization'}
          </span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 shadow-2xl">
        {/* STEP 1: Choose Job Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Choose Productive Job</h2>
              <p className="text-sm text-slate-400 mt-1">
                Select a structured task designed to safely convert excess AI quota into useful R&D output.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl border-2 border-blue-500 bg-blue-500/10 cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-5 h-5 text-blue-400" />
                    <h3 className="font-bold text-white">Repo Lab</h3>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-900 text-blue-300">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Safely clones, builds, and inspects an unknown public GitHub repository inside an isolated disposable sandbox.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/40 opacity-60 cursor-not-allowed">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-slate-400">Website Study</h3>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                    Phase 6
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Deterministic browser inspection and responsive screenshots with Playwright.
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
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
              <h2 className="text-2xl font-bold text-white tracking-tight">Configure Repo Lab</h2>
              <p className="text-sm text-slate-400 mt-1">
                Specify the public GitHub repository and evaluation objective.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Public GitHub Repository URL
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repository"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Only public repositories are permitted in V1. Private repositories and credentials are never accessed.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                  Task Objective
                </label>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {(['shallow', 'standard', 'deep'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium uppercase tracking-wider transition ${
                      depth === d
                        ? 'border-blue-500 bg-blue-500/10 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d} Analysis
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={runTests}
                    onChange={(e) => setRunTests(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Run automated tests inside sandbox</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateFixes}
                    onChange={(e) => setGenerateFixes(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Generate code improvement patch</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                <span>Select Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Account Selection */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Assign AI Account</h2>
              <p className="text-sm text-slate-400 mt-1">
                Choose which account's remaining quota will fund this execution.
              </p>
            </div>

            <div className="space-y-3">
              {eligibleAccounts.map((account) => {
                const snapshot = state.snapshots.find((s) => s.accountId === account.id);
                const isSelected = selectedAccountId === account.id;
                const isRecommended = account.id === state.suggestion?.recommendedAccountId;

                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-white text-sm">{account.displayAlias}</span>
                          {isRecommended && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                              🔥 USE SOON
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {snapshot?.windows[0]?.remainingFraction
                            ? `${Math.round(snapshot.windows[0].remainingFraction * 100)}% quota remaining`
                            : 'Active account'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs text-slate-400">
                      {account.providerId.toUpperCase()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
              >
                <span>Security Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Security Profile */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Balanced Sandbox Profile</h2>
              <p className="text-sm text-slate-400 mt-1">
                Hard isolation boundaries enforced before any container starts.
              </p>
            </div>

            <div className="space-y-3 bg-slate-950 p-5 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-900">
                <span className="text-slate-400">Filesystem Isolation</span>
                <span className="text-emerald-400 font-mono font-semibold">Zero Host Directory Mounts</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-900">
                <span className="text-slate-400">Docker Socket Access</span>
                <span className="text-emerald-400 font-mono font-semibold">Disabled (No DinD)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-900">
                <span className="text-slate-400">Network Policy</span>
                <span className="text-emerald-400 font-mono font-semibold">Public Web Only (No LAN / Localhost)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-900">
                <span className="text-slate-400">Resource Limits</span>
                <span className="text-slate-200 font-mono">2 CPU Cores / 2048 MB RAM</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-slate-400">Process User</span>
                <span className="text-slate-200 font-mono">Unprivileged (UID 1000)</span>
              </div>
            </div>

            {preflightError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center space-x-2">
                <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{preflightError}</span>
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                onClick={handleProceedToPreflight}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
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
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                  Pre-Run Safety Guarantee
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Preflight Verification</h2>
              <p className="text-sm text-emerald-400 font-semibold mt-1">
                Nothing has executed yet. All checks below are purely non-executing static validations.
              </p>
            </div>

            <div className="space-y-3">
              {preflightResults.map((check, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between"
                >
                  <div className="flex items-start space-x-3">
                    {check.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="font-semibold text-sm text-white">{check.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{check.message}</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-emerald-400">PASS</span>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                disabled={!preflightPassed}
                onClick={() => setStep(6)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition cursor-pointer"
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
            <div className="p-6 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-base uppercase tracking-wider font-mono">
                  Final Human Authorization Required
                </h3>
              </div>

              <div className="space-y-2 text-sm text-slate-200">
                <p>
                  You are about to execute an isolated R&D evaluation of{' '}
                  <strong className="text-white font-mono">{repoUrl}</strong> funded by{' '}
                  <strong className="text-amber-300">{selectedAccount?.displayAlias}</strong>.
                </p>
                <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  🛡️ <strong>Sandbox Safety Statement:</strong> Unknown code may execute inside an isolated sandbox. It cannot access your normal files, SSH keys, or private repositories.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinalRunJob}
                  className="w-full py-4 rounded-xl text-base font-extrabold uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition transform active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>RUN JOB</span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <button
                onClick={() => setStep(5)}
                className="flex items-center space-x-1 hover:text-slate-300"
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
