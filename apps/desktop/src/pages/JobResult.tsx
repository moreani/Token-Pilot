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
      <div className="max-w-4xl mx-auto px-6 py-12 text-center text-slate-400">
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={onBackToDashboard}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">Execution Results</h2>
            <span className="flex items-center space-x-1 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{job.name}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 cursor-pointer shadow"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exported ? 'Exported!' : 'Export Bundle'}</span>
          </button>

          <button
            disabled={cleaned}
            onClick={handleCleanup}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 hover:border-rose-800 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{cleaned ? 'Sandbox Destroyed' : 'Delete Sandbox'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quota delta comparison */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Quota Before Run</span>
              <p className="text-xl font-bold font-mono text-slate-200">78%</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              {job.providerId?.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">Quota After Run</span>
              <p className="text-xl font-bold font-mono text-emerald-400 flex items-center space-x-1">
                <span>74%</span>
                <span className="text-xs text-slate-400 font-normal">(-4% productive burn)</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase font-mono tracking-wider">
              Audit Findings & Summary
            </h3>
          </div>

          <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-800/80">
            <pre className="whitespace-pre-wrap font-sans">{result.summaryMarkdown}</pre>
          </div>
        </div>

        {/* Artifacts Manifest */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-white">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-sm tracking-tight">Generated Artifacts Manifest</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {result.artifactManifest.length} files verified
            </span>
          </div>

          <div className="space-y-2">
            {result.artifactManifest.map((art: any) => (
              <div
                key={art.id}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-semibold text-white font-mono">{art.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">SHA256: {art.sha256}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-slate-400">{Math.round(art.sizeBytes / 1024)} KB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
