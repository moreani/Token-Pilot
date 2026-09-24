import React from 'react';
import { Shield, Activity, Terminal, Stethoscope, FileText, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit';
  setActiveTab: (tab: 'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit') => void;
  activeJobId: string | null;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeJobId,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur sticky top-0 z-50 px-6 py-3 flex items-center justify-between transition-colors duration-200">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="heading-500 font-medium text-lg tracking-wide text-[var(--text-main)]">
              TokenPilot
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-medium">
              Local V1
            </span>
          </div>
          <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-70 -mt-0.5">
            AI Subscription Command Center
          </p>
        </div>
      </div>

      <nav className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--text-main)] opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </button>

        {activeJobId && (
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'console'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Job Console</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('doctor')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'doctor'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--text-main)] opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800/60'
          }`}
        >
          <Stethoscope className="w-3.5 h-3.5" />
          <span>Doctor</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-[var(--text-main)] opacity-70 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Audit Log</span>
        </button>
      </nav>

      <div className="flex items-center space-x-3 text-xs">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle Light/Dark Theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-[var(--text-main)] transition cursor-pointer font-medium"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-medium">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-slate-700" />
              <span className="text-[11px] font-medium">Dark</span>
            </>
          )}
        </button>

        <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 px-2.5 py-1 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Manual-Execution Only</span>
        </div>
      </div>
    </header>
  );
};
