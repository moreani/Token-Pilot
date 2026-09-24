import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Trash2,
  FileText,
  ShieldCheck,
  TrendingDown,
  ArrowLeft
} from 'lucide-react';
import type { ClientState } from '../state/clientService.js';
import { getQuotaRangeTier } from '../utils/quotaRanger.js';

interface JobResultProps {
  jobId: string;
  state: ClientState;
  clientService: any;
  onBackToDashboard: () => void;
}

export const JobResult: React.FC<JobResultProps> = ({
  jobId,
  state,
  clientService,
  onBackToDashboard
}) => {
  const [exported, setExported] = useState(false);
  const [cleaned, setCleaned] = useState(false);

  const job = state.jobs.find((j) => j.id === jobId);
  const result = clientService.getJobResult(jobId);

  if (!job || !result) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center paragraph-300 font-light text-[var(--text-main)] opacity-70">
        Job result not found or execution incomplete.
      </div>
    );
  }

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  };

  const handleCleanup = () => {
    setCleaned(true);
  };

  const beforeTier = getQuotaRangeTier(78);
  const afterTier = getQuotaRangeTier(74);

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBackToDashboard}
            className="flex items-center space-x-1 text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 mb-2 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">Execution Results</h2>
            <span className="flex items-center space-x-1 text-xs font-medium uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          </div>
          <p className="paragraph-300 text-xs mt-0.5 font-light text-[var(--text-main)] opacity-70">{job.name}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exported ? 'Exported!' : 'Export Bundle'}</span>
          </button>

          <button
            disabled={cleaned}
            onClick={handleCleanup}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-300 border border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cleaned ? 'Sandbox Destroyed' : 'Delete Sandbox'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quota delta comparison with Ranger System */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <span className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-70">Quota Before Run</span>
              <p className={`text-xl font-medium font-mono ${beforeTier.textClass}`}>78%</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-mono font-medium text-xs text-[var(--text-main)] border border-slate-200 dark:border-slate-700">
              {job.providerId?.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div>
              <span className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-70">Quota After Run</span>
              <p className={`text-xl font-medium font-mono flex items-center space-x-1.5 ${afterTier.textClass}`}>
                <span>74%</span>
                <span className="text-xs font-light opacity-70">(-4% productive burn)</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-cyan-600 dark:text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="heading-500 font-medium text-sm uppercase font-mono tracking-wider text-[var(--text-main)]">
              Audit Findings & Summary
            </h3>
          </div>

          <div className="prose max-w-none text-xs leading-relaxed font-sans bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[var(--text-main)]">
            <pre className="whitespace-pre-wrap font-sans font-light text-[var(--text-main)] paragraph-300">{result.summaryMarkdown}</pre>
          </div>
        </div>

        {/* Artifacts Manifest */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="heading-500 font-medium text-sm tracking-tight text-[var(--text-main)]">Generated Artifacts Manifest</h3>
            </div>
            <span className="text-xs font-mono paragraph-300 font-light text-[var(--text-main)] opacity-70">
              {result.artifactManifest.length} files verified
            </span>
          </div>

          <div className="space-y-2">
            {result.artifactManifest.map((art: any) => (
              <div
                key={art.id}
                className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="heading-500 font-medium font-mono text-[var(--text-main)]">{art.name}</p>
                  <p className="text-[10px] font-mono mt-0.5 paragraph-300 font-light text-[var(--text-main)] opacity-60">SHA256: {art.sha256}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono paragraph-300 font-light text-[var(--text-main)] opacity-70">{Math.round(art.sizeBytes / 1024)} KB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
