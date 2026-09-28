import React, { useState, useEffect } from 'react';
import { clientService } from './state/clientService.js';
import type { Account, ClientState } from './state/clientService.js';
import { Navbar } from './components/Navbar.js';
import { Dashboard } from './pages/Dashboard.js';
import { JobWizard } from './pages/JobWizard.js';
import { JobConsole } from './pages/JobConsole.js';
import { JobResult } from './pages/JobResult.js';
import { Doctor } from './pages/Doctor.js';
import { AuditLog } from './pages/AuditLog.js';
import { SkillsHub } from './pages/SkillsHub.js';
import type { AcceleratorSkill } from './pages/SkillsHub.js';
import { MyProjects } from './pages/MyProjects.js';

export const App: React.FC = () => {
  const [state, setState] = useState<ClientState>(clientService.getState());
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit' | 'skills' | 'projects'
  >('dashboard');
  const [selectedAccountForJob, setSelectedAccountForJob] = useState<Account | null>(null);
  const [selectedSkillForJob, setSelectedSkillForJob] = useState<AcceleratorSkill | null>(null);
  const [viewingResultJobId, setViewingResultJobId] = useState<string | null>(null);

  // Theme Management (Light & Dark with persistence)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('tokenpilot_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // fallback
    }
    return 'dark';
  });

  useEffect(() => {
    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
      localStorage.setItem('tokenpilot_theme', theme);
    } catch {
      // storage unavailable
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setState({ ...clientService.getState() });
    const unsubscribe = clientService.subscribe(() => {
      setState({ ...clientService.getState() });
    });
    clientService.refreshQuotas();
    return unsubscribe;
  }, []);

  const handleUseCredit = () => {
    const recommended = state.accounts.find((a) => a.id === state.suggestion?.recommendedAccountId);
    setSelectedAccountForJob(recommended || null);
    setSelectedSkillForJob(null);
    setActiveTab('wizard');
  };

  const handleSelectAccountForJob = (account: Account) => {
    setSelectedAccountForJob(account);
    setSelectedSkillForJob(null);
    setActiveTab('wizard');
  };

  const handleLaunchJob = (jobId: string) => {
    setActiveTab('console');
  };

  const handleViewResults = (jobId: string) => {
    setViewingResultJobId(jobId);
    setActiveTab('result');
  };

  const handleLaunchJobWithSkill = (skill: AcceleratorSkill) => {
    setSelectedSkillForJob(skill);
    setActiveTab('wizard');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-main)] flex flex-col font-sans transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeJobId={state.activeJobId}
        theme={theme}
        onToggleTheme={toggleTheme}
        updatesCount={state.updaterStatus?.totalUpdatesAvailable}
        patternsCount={state.memoryStats?.totalPatternsLearned}
        projectsCount={state.savedProjects?.length}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            onRefreshQuotas={() => clientService.refreshQuotas()}
            onUseCredit={handleUseCredit}
            onSelectAccountForJob={handleSelectAccountForJob}
            onUpdateAlias={(id, alias) => clientService.updateAccountAlias(id, alias)}
            onStartJob={() => {
              setSelectedAccountForJob(null);
              setSelectedSkillForJob(null);
              setActiveTab('wizard');
            }}
          />
        )}

        {activeTab === 'projects' && (
          <MyProjects
            state={state}
            clientService={clientService}
            onOpenWizard={() => setActiveTab('wizard')}
            onViewJobResult={handleViewResults}
          />
        )}

        {activeTab === 'skills' && (
          <SkillsHub onLaunchJobWithSkill={handleLaunchJobWithSkill} />
        )}

        {activeTab === 'wizard' && (
          <JobWizard
            state={state}
            initialAccount={selectedAccountForJob}
            initialSkill={selectedSkillForJob}
            clientService={clientService}
            onCancel={() => setActiveTab('dashboard')}
            onLaunchJob={handleLaunchJob}
          />
        )}

        {activeTab === 'console' && state.activeJobId && (
          <JobConsole
            jobId={state.activeJobId}
            state={state}
            clientService={clientService}
            onViewResults={handleViewResults}
            onNavigateToProjects={() => setActiveTab('projects')}
          />
        )}

        {activeTab === 'result' && (viewingResultJobId || state.activeJobId) && (
          <JobResult
            jobId={viewingResultJobId || state.activeJobId!}
            state={state}
            clientService={clientService}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'doctor' && (
          <Doctor state={state} clientService={clientService} />
        )}

        {activeTab === 'audit' && (
          <AuditLog state={state} />
        )}
      </main>
    </div>
  );
};
