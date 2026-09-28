import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Stethoscope,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Brain,
  Zap,
  ArrowUpRight,
  Play,
  RotateCw,
  Box,
  Layers
} from 'lucide-react';
import type { ClientState } from '../state/clientService.js';

interface DoctorProps {
  state: ClientState;
  clientService: any;
}

export const Doctor: React.FC<DoctorProps> = ({ state, clientService }) => {
  const report = clientService.getSystemDoctorReport();
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [applyingUpdates, setApplyingUpdates] = useState(false);
  const [updateLog, setUpdateLog] = useState<string[]>([]);
  const [testingSelfHeal, setTestingSelfHeal] = useState(false);
  const [selfHealLog, setSelfHealLog] = useState<string | null>(null);

  const updater = clientService.getUpdaterStatus();
  const memoryStats = clientService.getExperienceMemoryStats();
  const learnedPatterns = clientService.getLearnedPatterns();

  const handleCheckUpdates = async () => {
    setCheckingUpdates(true);
    setUpdateLog(['Checking remote catalog and package registries...']);
    try {
      await clientService.checkForUpdates();
      setUpdateLog((prev) => [...prev, 'Component versions compared against upstream latest.']);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleApplyUpdates = async () => {
    setApplyingUpdates(true);
    setUpdateLog(['Initiating atomic update sequence...']);
    try {
      const res = await clientService.applyUpdates(undefined, (msg: string) => {
        setUpdateLog((prev) => [...prev, msg]);
      });
      setUpdateLog((prev) => [...prev, `Updated ${res.updatedComponents.length} components. System verified green!`]);
    } finally {
      setApplyingUpdates(false);
    }
  };

  const handleTestSelfHealing = async () => {
    setTestingSelfHeal(true);
    setSelfHealLog('Injecting synthetic AST traversal recursion flaw into diagnostic sandbox...');
    try {
      const res = await clientService.triggerDiagnosticAutoRepair();
      setSelfHealLog(
        `Resolved in ${res.cyclesExecuted} cycle(s)! ${
          res.resolvedViaMemory
            ? 'Matched existing pattern in Experience Store (0 tokens burned).'
            : 'Formulated novel hypothesis, synthesized patch, and committed new pattern to Memory Bank.'
        } Saved ~${Math.round(res.tokensSavedTotal / 1000)}k tokens.`
      );
    } finally {
      setTestingSelfHeal(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
              System Doctor, Auto-Updater &amp; Learning Hub
            </h2>
          </div>
          <p className="paragraph-300 text-xs mt-1 font-light text-[var(--text-main)] opacity-70">
            Validates sandboxing, manages automatic component updates, and tracks self-healing project memory.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Core System Operational</span>
        </div>
      </div>

      {/* SECTION 1: AUTO-UPDATER & COMPONENT FRESHNESS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <RefreshCw className="w-5 h-5 text-cyan-500" />
            <div>
              <h3 className="heading-500 text-sm font-medium tracking-tight text-[var(--text-main)]">
                Autonomous Component Updater
              </h3>
              <p className="text-xs text-[var(--text-main)] opacity-70 font-light">
                Continuous upstream checking for engine, skills catalog, provider CLI bridges, and CVE profiles.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCheckUpdates}
              disabled={checkingUpdates || applyingUpdates}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--text-main)] transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${checkingUpdates ? 'animate-spin' : ''}`} />
              <span>{checkingUpdates ? 'Checking...' : 'Check Updates'}</span>
            </button>

            {updater.totalUpdatesAvailable > 0 && (
              <button
                onClick={handleApplyUpdates}
                disabled={applyingUpdates}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xs transition cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{applyingUpdates ? 'Updating...' : `Auto-Update All (${updater.totalUpdatesAvailable})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {updater.components.map((comp: any) => (
            <div
              key={comp.component}
              className={`p-3.5 rounded-xl border transition ${
                comp.hasUpdate
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[var(--text-main)]">{comp.displayName}</span>
                <span
                  className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                    comp.hasUpdate
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {comp.hasUpdate ? 'Update Available' : 'Up to Date'}
                </span>
              </div>

              <div className="flex items-center space-x-3 text-[11px] font-mono opacity-70 mb-2">
                <span>Current: v{comp.currentVersion}</span>
                {comp.hasUpdate && (
                  <>
                    <span>➔</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Latest: v{comp.latestVersion}</span>
                  </>
                )}
              </div>

              <div className="space-y-0.5">
                {comp.releaseNotes.slice(0, 2).map((note: string, idx: number) => (
                  <p key={idx} className="text-[11px] font-light text-[var(--text-main)] opacity-65 flex items-start space-x-1">
                    <span className="opacity-40">•</span>
                    <span className="truncate">{note}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Update Activity Log */}
        {updateLog.length > 0 && (
          <div className="p-3 rounded-xl bg-slate-950 text-cyan-300 font-mono text-[11px] space-y-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1">Update Execution Log:</span>
            {updateLog.map((line, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <span className="opacity-40 select-none">$</span>
                <span>{line}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: EXPERIENCE MEMORY BANK & ADAPTIVE LEARNING */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <Brain className="w-5 h-5 text-purple-500" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="heading-500 text-sm font-medium tracking-tight text-[var(--text-main)]">
                  Experience Memory Bank (Self-Healing &amp; Adaptive Learning)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold">
                  PRD §48 &amp; §61
                </span>
              </div>
              <p className="text-xs text-[var(--text-main)] opacity-70 font-light">
                Stores error fingerprints and proven patches. Gets smarter, faster, and cheaper with every project built.
              </p>
            </div>
          </div>

          <button
            onClick={handleTestSelfHealing}
            disabled={testingSelfHeal}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition cursor-pointer flex items-center space-x-1.5 shrink-0 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${testingSelfHeal ? 'animate-pulse' : 'fill-current'}`} />
            <span>{testingSelfHeal ? 'Healing...' : 'Test Self-Healing'}</span>
          </button>
        </div>

        {/* Memory Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-mono uppercase opacity-60 block">Learned Patterns</span>
            <span className="text-xl font-mono font-bold text-purple-600 dark:text-purple-400">
              {memoryStats.totalPatternsLearned}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-mono uppercase opacity-60 block">Repairs Executed</span>
            <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {memoryStats.totalRepairsExecuted}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-mono uppercase opacity-60 block">Tokens Saved via Memory</span>
            <span className="text-xl font-mono font-bold text-amber-500">
              ~{Math.round(memoryStats.totalTokensSavedViaMemory / 1000)}k
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80">
            <span className="text-[10px] font-mono uppercase opacity-60 block">Avg Confidence</span>
            <span className="text-xl font-mono font-bold text-cyan-500">
              {Math.round(memoryStats.averageConfidenceScore * 100)}%
            </span>
          </div>
        </div>

        {selfHealLog && (
          <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-700 dark:text-purple-300">
            <strong>Self-Healing Result:</strong> {selfHealLog}
          </div>
        )}

        {/* Top Learned Patterns Table */}
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
            INDEXED ERROR FINGERPRINTS &amp; ZERO-TOKEN PATCH TEMPLATES:
          </span>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {learnedPatterns.map((pat: any) => (
              <div
                key={pat.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-slate-200 dark:bg-slate-800 text-[var(--text-main)]">
                      {pat.fingerprint.category}
                    </span>
                    <span className="font-mono font-semibold text-[var(--text-main)]">{pat.id}</span>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                      {(pat.confidenceScore * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-[11px] font-light text-[var(--text-main)] opacity-75">{pat.explanation}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] font-mono text-amber-500 block">
                    ~{Math.round(pat.tokensSavedTotal / 1000)}k tokens saved
                  </span>
                  <span className="text-[10px] font-mono opacity-50 block">
                    {pat.successCount}x verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: SYSTEM DIAGNOSTICS REPORT */}
      <div className="space-y-6">
        {(['quota', 'execution', 'browser'] as const).map((category) => {
          const categoryChecks = report.checks.filter((c: any) => c.category === category);
          return (
            <div key={category} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl">
              <h3 className="heading-500 text-xs font-mono uppercase tracking-wider font-medium text-[var(--text-main)] opacity-70 mb-4 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{category} Diagnostic Layer</span>
              </h3>

              <div className="space-y-3">
                {categoryChecks.map((check: any) => (
                  <div
                    key={check.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-start justify-between text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      {check.status === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                      ) : check.status === 'not_configured' ? (
                        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="heading-500 font-medium text-[var(--text-main)]">{check.name}</p>
                        <p className="paragraph-300 font-light text-[var(--text-main)] opacity-70 mt-0.5">{check.message}</p>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[10px] uppercase font-medium px-2 py-0.5 rounded ${
                        check.status === 'ok'
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60'
                          : check.status === 'not_configured'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60'
                      }`}
                    >
                      {check.status === 'ok' ? 'READY' : check.status === 'not_configured' ? 'OPTIONAL' : 'ATTENTION'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
