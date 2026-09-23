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

export const App: React.FC = () => {
  const [state, setState] = useState<ClientState>(clientService.getState());
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'wizard' | 'console' | 'result' | 'doctor' | 'audit'
  >('dashboard');
  const [selectedAccountForJob, setSelectedAccountForJob] = useState<Account | null>(null);
  const [viewingResultJobId, setViewingResultJobId] = useState<string | null>(null);

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
    setActiveTab('wizard');
  };

  const handleSelectAccountForJob = (account: Account) => {
    setSelectedAccountForJob(account);
    setActiveTab('wizard');
  };

  const handleLaunchJob = (jobId: string) => {
    setActiveTab('console');
  };

  const handleViewResults = (jobId: string) => {
    setViewingResultJobId(jobId);
    setActiveTab('result');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeJobId={state.activeJobId}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <Dashboard
            state={state}
            onRefreshQuotas={() => clientService.refreshQuotas()}
            onUseCredit={handleUseCredit}
            onSelectAccountForJob={handleSelectAccountForJob}
            onUpdateAlias={(id, alias) => clientService.updateAccountAlias(id, alias)}
          />
        )}

        {activeTab === 'wizard' && (
          <JobWizard
            state={state}
            initialAccount={selectedAccountForJob}
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
