import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Stethoscope } from 'lucide-react';
import type { ClientState } from '../state/clientService.js';

interface DoctorProps {
  state: ClientState;
  clientService: any;
}

export const Doctor: React.FC<DoctorProps> = ({ clientService }) => {
  const report = clientService.getSystemDoctorReport();

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
              System Doctor & Diagnostics
            </h2>
          </div>
          <p className="paragraph-300 text-xs mt-1 font-light text-[var(--text-main)] opacity-70">
            Validates local quota collector readiness, disposable container sandboxing, and browser automation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Core System Operational</span>
        </div>
      </div>

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
