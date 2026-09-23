import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, Stethoscope, RefreshCw } from 'lucide-react';
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
            <Stethoscope className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">System Doctor & Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validates local quota collector readiness, disposable container sandboxing, and browser automation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Core System Operational</span>
        </div>
      </div>

      <div className="space-y-6">
        {(['quota', 'execution', 'browser'] as const).map((category) => {
          const categoryChecks = report.checks.filter((c: any) => c.category === category);
          return (
            <div key={category} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-400 mb-4 flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{category} Diagnostic Layer</span>
              </h3>

              <div className="space-y-3">
                {categoryChecks.map((check: any) => (
                  <div
                    key={check.id}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/80 flex items-start justify-between text-xs"
                  >
                    <div className="flex items-start space-x-3">
                      {check.status === 'ok' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      ) : check.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                      ) : check.status === 'not_configured' ? (
                        <Info className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-white">{check.name}</p>
                        <p className="text-slate-400 mt-0.5">{check.message}</p>
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        check.status === 'ok'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : check.status === 'not_configured'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-amber-950 text-amber-400 border border-amber-800/60'
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
