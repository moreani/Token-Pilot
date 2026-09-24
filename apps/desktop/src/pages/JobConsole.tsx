import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Pause, Play, Square, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import type { ClientState } from '../state/clientService.js';

interface JobConsoleProps {
  jobId: string;
  state: ClientState;
  clientService: any;
  onViewResults: (jobId: string) => void;
}

export const JobConsole: React.FC<JobConsoleProps> = ({
  jobId,
  state,
  clientService,
  onViewResults
}) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [elapsedSec, setElapsedSec] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const job = state.jobs.find((j) => j.id === jobId);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (job?.state === 'RUNNING' || job?.state === 'PREPARING_SANDBOX' || job?.state === 'STARTING_AGENT') {
      timer = setInterval(() => {
        setElapsedSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [job?.state]);

  useEffect(() => {
    if (job?.state === 'AUTHORIZED') {
      clientService.runJobLifecycle(jobId, (msg: string) => {
        setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
      });
    }
  }, [jobId]);

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 text-center paragraph-300 font-light text-[var(--text-main)] opacity-70">
        Job not found.
      </div>
    );
  }

  const isPaused = job.state === 'PAUSED';
  const isCompleted = job.state === 'COMPLETED';

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium">
              Live Execution
            </span>
            <span className="text-xs font-mono paragraph-300 font-light text-[var(--text-main)] opacity-70 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Elapsed: {elapsedSec}s</span>
            </span>
          </div>
          <h2 className="heading-500 text-xl font-medium tracking-tight mt-1 text-[var(--text-main)]">{job.name}</h2>
          <p className="paragraph-300 text-xs mt-0.5 font-light text-[var(--text-main)] opacity-70">
            Target Account: <strong className="font-medium text-[var(--text-main)]">{job.accountId}</strong>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {job.state === 'RUNNING' && (
            <button
              onClick={() => clientService.pauseJob(jobId)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 hover:bg-amber-500 text-white transition cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={() => clientService.resumeJob(jobId)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </button>
          )}

          {job.state !== 'COMPLETED' && job.state !== 'CANCELLED' && (
            <button
              onClick={() => clientService.stopJob(jobId)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-slate-300 dark:border-slate-700 hover:border-rose-400 dark:hover:border-rose-700 transition cursor-pointer"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          {isCompleted && (
            <button
              onClick={() => onViewResults(jobId)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg transition active:scale-95 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>View Results</span>
            </button>
          )}
        </div>
      </div>

      {/* State Progress Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl mb-6 flex items-center justify-between text-xs font-mono shadow-xs">
        {[
          { key: 'AUTHORIZED', label: 'Authorized' },
          { key: 'PREPARING_SANDBOX', label: 'Preparing Sandbox' },
          { key: 'SANDBOX_READY', label: 'Sandbox Ready' },
          { key: 'RUNNING', label: 'Running' },
          { key: 'COMPLETED', label: 'Completed' }
        ].map((st, i) => {
          const isCurrent = job.state === st.key;
          const isDone = isCompleted || (i < 3 && (job.state === 'RUNNING' || job.state === 'SANDBOX_READY'));
          return (
            <div key={st.key} className="flex items-center space-x-2">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-medium ${
                  isCurrent
                    ? 'bg-amber-400 text-black animate-pulse'
                    : isDone
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </span>
              <span className={`heading-500 font-medium ${isCurrent ? 'text-amber-600 dark:text-amber-300' : isDone ? 'text-[var(--text-main)]' : 'opacity-40'}`}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Terminal Output */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Sandbox Execution Log & Auditor Stream</span>
          </div>
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="text-[11px]">Strict Isolation Active</span>
          </div>
        </div>

        <div className="p-5 font-mono text-xs text-slate-300 h-96 overflow-y-auto space-y-2 leading-relaxed selection:bg-cyan-900 selection:text-white">
          {logs.length === 0 ? (
            <p className="text-slate-500 italic font-light">Initializing runner pipeline...</p>
          ) : (
            logs.map((line, idx) => (
              <div key={idx} className="flex space-x-2">
                <span className="text-slate-600 select-none">$</span>
                <span className={line.includes('[Sandbox]') ? 'text-cyan-300' : line.includes('[Exec]') ? 'text-emerald-300' : 'text-slate-300'}>
                  {line}
                </span>
              </div>
            ))
          )}
          {isCompleted && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-lg text-emerald-300 mt-4 font-medium">
              ✔ Execution completed successfully. Artifacts verified and stored.
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
};
