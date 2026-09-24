import React from 'react';
import { FileText } from 'lucide-react';
import type { ClientState } from '../state/clientService.js';

interface AuditLogProps {
  state: ClientState;
}

export const AuditLog: React.FC<AuditLogProps> = ({ state }) => {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
              Security & Audit Event Log
            </h2>
          </div>
          <p className="paragraph-300 text-xs mt-1 font-light text-[var(--text-main)] opacity-70">
            Local SQLite audit trail recording all human authorizations, sandbox startups, and quota refreshes.
          </p>
        </div>

        <span className="font-mono text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70">
          {state.auditEvents.length} events logged
        </span>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {state.auditEvents.length === 0 ? (
            <div className="p-8 text-center paragraph-300 text-xs italic font-light text-[var(--text-main)] opacity-50">
              No audit events recorded yet.
            </div>
          ) : (
            state.auditEvents.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded uppercase ${
                        evt.severity === 'security'
                          ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : evt.severity === 'warn'
                          ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="opacity-60 font-mono text-[11px] paragraph-300 font-light text-[var(--text-main)]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="heading-500 font-medium text-[var(--text-main)]">{evt.message}</p>
                  {evt.jobId && (
                    <p className="text-[11px] font-mono opacity-60 paragraph-300 font-light text-[var(--text-main)]">Job ID: {evt.jobId}</p>
                  )}
                </div>

                <div className="text-right opacity-60 font-mono text-[11px] paragraph-300 font-light text-[var(--text-main)]">
                  {new Date(evt.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
