import React from 'react';
import { FileText, ShieldAlert, CheckCircle, Info } from 'lucide-react';
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
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="text-2xl font-bold text-white tracking-tight">Security & Audit Event Log</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Local SQLite audit trail recording all human authorizations, sandbox startups, and quota refreshes.
          </p>
        </div>

        <span className="font-mono text-xs text-slate-400">
          {state.auditEvents.length} events logged
        </span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800">
          {state.auditEvents.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs italic">
              No audit events recorded yet.
            </div>
          ) : (
            state.auditEvents.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-800/40 transition flex items-start justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        evt.severity === 'security'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : evt.severity === 'warn'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {evt.type}
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-white font-medium">{evt.message}</p>
                  {evt.jobId && (
                    <p className="text-[11px] text-slate-400 font-mono">Job ID: {evt.jobId}</p>
                  )}
                </div>

                <div className="text-right text-slate-500 font-mono text-[11px]">
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
