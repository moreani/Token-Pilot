import React from 'react';
import { Shield, Activity, Terminal, Stethoscope, FileText } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit';
  setActiveTab: (tab: 'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit') => void;
  activeJobId: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, activeJobId }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg tracking-wide text-white">TokenPilot</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              Local V1
            </span>
          </div>
          <p className="text-xs text-slate-400 -mt-0.5">AI Subscription Command Center</p>
        </div>
      </div>

      <nav className="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {activeJobId && (
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTab === 'console'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-400 hover:bg-amber-950/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Job Console</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'doctor'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </nav>

      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Manual-Execution Only</span>
        </div>
      </div>
    </header>
  );
};
