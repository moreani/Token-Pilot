import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  ChevronUp,
  ChevronDown,
  Layers,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
  Network,
  ShieldAlert,
  TestTube2,
  Search,
  Compass,
  FileText,
  Terminal,
  ExternalLink,
  Box,
  Flame,
  Cpu,
  Palette,
  RotateCw,
  FolderGit2,
  Bug
} from 'lucide-react';

import type { Account, ClientState } from '../state/clientService.js';
import type {
  OpportunityRecord,
  RDExecutionMode,
  OpportunityCategory
} from '@tokenpilot/contracts';
import {
  SEED_OPPORTUNITIES,
  getResearchItemsForOpportunity,
  getBuildPackForOpportunity,
  getMockTestResults,
  getMockRepairHistory,
  getMockProjectPackage
} from '@tokenpilot/jobs';
import { getQuotaRangeTier } from '../utils/quotaRanger.js';

interface JobWizardProps {
  state: ClientState;
  initialAccount?: Account | null;
  initialSkill?: any;
  onCancel: () => void;
  onLaunchJob: (jobId: string) => void;
  clientService: any;
}

export const JobWizard: React.FC<JobWizardProps> = ({
  state,
  initialAccount,
  initialSkill,
  onCancel,
  onLaunchJob,
  clientService
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // Step 1: Discovery State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'all'>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [selectedOppId, setSelectedOppId] = useState<string>(SEED_OPPORTUNITIES[0].id);

  // Step 2: Selected Opportunity & Mode
  const [executionMode, setExecutionMode] = useState<RDExecutionMode>('build');

  const activeOpp = useMemo(() => {
    return SEED_OPPORTUNITIES.find((o) => o.id === selectedOppId) || SEED_OPPORTUNITIES[0];
  }, [selectedOppId]);

  // Filtered opportunities for Step 1
  const filteredOpportunities = useMemo(() => {
    return SEED_OPPORTUNITIES.filter((opp) => {
      const matchesCategory = selectedCategory === 'all' || opp.category === selectedCategory;
      const matchesComplexity = selectedComplexity === 'all' || opp.complexity === selectedComplexity;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        opp.title.toLowerCase().includes(q) ||
        opp.summary.toLowerCase().includes(q) ||
        opp.problem.toLowerCase().includes(q) ||
        opp.recommendedStack.some((s) => s.toLowerCase().includes(q));
      return matchesCategory && matchesComplexity && matchesQuery;
    });
  }, [searchQuery, selectedCategory, selectedComplexity]);

  // Step 3: Research Items & Account Pool State
  const researchItems = useMemo(() => {
    return getResearchItemsForOpportunity(activeOpp.id);
  }, [activeOpp.id]);

  const buildPack = useMemo(() => {
    return getBuildPackForOpportunity(activeOpp);
  }, [activeOpp]);

  const testResults = useMemo(() => getMockTestResults(), []);
  const repairHistory = useMemo(() => getMockRepairHistory(), []);
  const projectPackage = useMemo(() => getMockProjectPackage(activeOpp), [activeOpp]);

  // Account Pool State
  const eligibleAccounts = state.accounts.filter((a) => a.capabilities.executeJobs);

  // Auto-mode eligible accounts: Antigravity first (Priority 1), then OpenCode (Priority 2)
  const autoModeAccounts = eligibleAccounts
    .filter((a) => (a.providerId === 'antigravity' || a.providerId === 'opencode') && !a.manualOnly)
    .sort((a, b) => {
      const prioA = a.autoPriority ?? (a.providerId === 'antigravity' ? 1 : a.providerId === 'opencode' ? 2 : 99);
      const prioB = b.autoPriority ?? (b.providerId === 'antigravity' ? 1 : b.providerId === 'opencode' ? 2 : 99);
      return prioA - prioB;
    });

  // Manual-only accounts (Claude & Codex)
  const manualOnlyAccounts = eligibleAccounts.filter(
    (a) => a.manualOnly || a.providerId === 'claude' || a.providerId === 'codex'
  );

  const defaultAccount = initialAccount
    ? eligibleAccounts.find((a) => a.id === initialAccount.id)
    : (autoModeAccounts[0] || eligibleAccounts[0]);

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    defaultAccount ? [defaultAccount.id] : []
  );

  const selectedAccounts = selectedAccountIds
    .map((id) => eligibleAccounts.find((a) => a.id === id))
    .filter((a): a is Account => !!a);

  const primaryAccount = selectedAccounts[0] || defaultAccount || eligibleAccounts[0];

  const toggleAccountSelection = (accId: string) => {
    if (selectedAccountIds.includes(accId)) {
      if (selectedAccountIds.length === 1) return;
      setSelectedAccountIds(selectedAccountIds.filter((id) => id !== accId));
    } else {
      setSelectedAccountIds([...selectedAccountIds, accId]);
    }
  };

  const moveAccountPriority = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedAccountIds.length - 1) return;
    const newIds = [...selectedAccountIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newIds[index];
    newIds[index] = newIds[targetIndex];
    newIds[targetIndex] = temp;
    setSelectedAccountIds(newIds);
  };

  const selectAutoModeSequence = () => {
    if (autoModeAccounts.length > 0) {
      setSelectedAccountIds(autoModeAccounts.map((a) => a.id));
    }
  };

  const resetToPrimaryOnly = () => {
    const primary = defaultAccount || eligibleAccounts[0];
    if (primary) {
      setSelectedAccountIds([primary.id]);
    }
  };

  // Job Authorization State
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);

  // Step 6: Authorize & Run Job
  const handleFinalRunJob = () => {
    try {
      const accountPool = selectedAccounts.map((acc, idx) => ({
        accountId: acc.id,
        providerId: acc.providerId,
        displayAlias: acc.displayAlias,
        priority: idx + 1,
        status: idx === 0 ? ('active' as const) : ('standby' as const)
      }));

      const job = clientService.createRepoLabJob({
        name: `R&D Build: ${activeOpp.title.split('—')[0].trim()}`,
        repoUrl: activeOpp.openSourceOptions[0]?.url || 'https://github.com/facebook/react',
        objective: activeOpp.summary,
        depth: 'standard',
        runTests: true,
        generateFixes: true,
        providerId: primaryAccount.providerId,
        accountId: primaryAccount.id,
        accountPool
      });

      clientService.authorizeJob(job.id);
      onLaunchJob(job.id);
    } catch (err: any) {
      console.error('Failed to launch R&D build job:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Wizard Step Progress Navigation */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="paragraph-300 font-light text-[var(--text-main)] opacity-70">
            R&D BUILD ENGINE · STEP {step} OF 6
          </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {step === 1 && '1. Discover Idea'}
            {step === 2 && '2. Select & Assess'}
            {step === 3 && '3. Research & Quota'}
            {step === 4 && '4. Build Pack & Bootstrap'}
            {step === 5 && '5. Testing & Auto-Fix'}
            {step === 6 && '6. Working Project Delivery'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              onClick={() => {
                // Allow navigating back to any previous step
                if (s < step) setStep(s as any);
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                s === step
                  ? 'bg-blue-600 dark:bg-blue-500 shadow-sm shadow-blue-500/30'
                  : s < step
                  ? 'bg-emerald-500'
                  : 'bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Wizard Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
        
        {/* ========================================================================= */}
        {/* STEP 1: DISCOVER — Find Something Worth Building                          */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <Compass className="w-4 h-4" />
                <span>Discovery Engine</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Find Something Worth Building
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Continuous open-source scout and prompt-based idea generation. Filter by domain or search by technical pattern.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ideas, repositories, tools, frameworks, or UI patterns..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-light text-[var(--text-main)] focus:outline-none focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick Prefilled Prompts */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-[var(--text-main)] opacity-60">Try prompt:</span>
              {[
                'Find AI tools I can rebuild locally',
                'Screenshot to responsive frontend',
                'Knowledge graph AST analyzer',
                'Adaptive quota burn engine'
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setSearchQuery(prompt.split(' ')[0])}
                  className="px-2.5 py-1 rounded-md text-xs font-light bg-slate-100 dark:bg-slate-800 text-[var(--text-main)] hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                >
                  "{prompt}"
                </button>
              ))}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-xs font-mono text-[var(--text-main)] opacity-60 mr-1">Category:</span>
              {[
                { id: 'all', label: 'All Categories' },
                { id: 'ai', label: '🤖 AI & Vision' },
                { id: 'devtools', label: '🛠️ DevTools' },
                { id: 'saas', label: '☁️ SaaS' },
                { id: 'web', label: '🌐 Web' }
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[var(--text-main)] hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Discovered Opportunities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {filteredOpportunities.map((opp) => {
                const isSelected = opp.id === selectedOppId;
                return (
                  <div
                    key={opp.id}
                    onClick={() => setSelectedOppId(opp.id)}
                    className={`p-5 rounded-xl border text-left transition cursor-pointer relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-[var(--text-main)]">
                          {opp.category.toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider ${
                          opp.complexity === 'low'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : opp.complexity === 'medium'
                            ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}>
                          {opp.complexity} complexity
                        </span>
                      </div>

                      <h3 className="heading-500 font-medium text-base text-[var(--text-main)] mb-1">
                        {opp.title}
                      </h3>
                      <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-75 line-clamp-2 mb-3">
                        {opp.summary}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs font-mono">
                      <span className="opacity-60">{opp.estimatedDuration}</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium flex items-center space-x-1">
                        <span>Confidence {opp.researchConfidence}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <span>Select &amp; Assess Work</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SELECT — Choose Work & Multi-Dimensional Assessment               */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Opportunity Assessment</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Choose Work &amp; Execution Mode
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Inspect opportunity dimensions, open-source options, and select the desired development depth.
              </p>
            </div>

            {/* Active Opportunity Card */}
            <div className="p-6 rounded-xl border border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/10 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold">
                      {activeOpp.category.toUpperCase()}
                    </span>
                    <span className="text-xs font-mono opacity-60">Estimated: {activeOpp.estimatedDuration}</span>
                  </div>
                  <h3 className="heading-500 text-lg font-medium text-[var(--text-main)]">
                    {activeOpp.title}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">
                    {activeOpp.researchConfidence} Confidence
                  </span>
                </div>
              </div>

              {/* Problem & Why Now */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-rose-600 dark:text-rose-400 font-mono block mb-1">PROBLEM STATEMENT</span>
                  <p className="font-light text-[var(--text-main)] opacity-85 leading-relaxed">{activeOpp.problem}</p>
                </div>
                <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono block mb-1">WHY NOW</span>
                  <p className="font-light text-[var(--text-main)] opacity-85 leading-relaxed">{activeOpp.whyNow}</p>
                </div>
              </div>

              {/* Multi-Dimensional Assessment Bars */}
              <div className="pt-2">
                <span className="text-xs font-mono text-[var(--text-main)] opacity-70 block mb-2 font-medium">
                  MULTI-DIMENSIONAL FEASIBILITY PROFILE:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Novelty', val: activeOpp.dimensions.novelty, color: 'bg-purple-500' },
                    { label: 'Resource Availability', val: activeOpp.dimensions.resourceAvailability, color: 'bg-blue-500' },
                    { label: 'Learning Value', val: activeOpp.dimensions.learningValue, color: 'bg-emerald-500' },
                    { label: 'Portfolio Relevance', val: activeOpp.dimensions.portfolioRelevance, color: 'bg-amber-500' },
                    { label: 'Testing Feasibility', val: activeOpp.dimensions.testingFeasibility, color: 'bg-cyan-500' }
                  ].map((dim) => (
                    <div key={dim.label} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between text-[11px] font-mono mb-1">
                        <span className="opacity-70 truncate">{dim.label}</span>
                        <span className="font-semibold">{dim.val}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full ${dim.color} rounded-full`} style={{ width: `${dim.val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Stack */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-mono opacity-60 mr-1">Recommended Stack:</span>
                {activeOpp.recommendedStack.map((tech) => (
                  <span
                    key={tech}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[var(--text-main)]"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Execution Mode Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 mb-2 font-medium">
                Select Execution Mode (PRD Section 13):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    mode: 'explore' as const,
                    title: 'Explore',
                    badge: 'Research Only',
                    desc: 'Produces architecture, dependency trees, risk analyses, and reference guides. No code executed.'
                  },
                  {
                    mode: 'experiment' as const,
                    title: 'Experiment',
                    badge: 'Core PoC',
                    desc: 'Builds one critical end-to-end user flow with minimal UI, database persistence, and baseline tests.'
                  },
                  {
                    mode: 'build' as const,
                    title: 'Build',
                    badge: 'Complete Project',
                    desc: 'Full customized application with 6-stage automated testing, visual QA, and complete delivery package.'
                  }
                ].map((m) => (
                  <button
                    key={m.mode}
                    type="button"
                    onClick={() => setExecutionMode(m.mode)}
                    className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                      executionMode === m.mode
                        ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="heading-500 font-medium text-sm text-[var(--text-main)]">{m.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold">
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs font-light text-[var(--text-main)] opacity-80 leading-relaxed">
                        {m.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(1)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Discovery</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <span>Initiate Research Engine</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: RESEARCH — Research Engine & Quota Funding Pool                   */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <Box className="w-4 h-4" />
                <span>Research &amp; Provenance Engine</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Discovered Resources &amp; Account Funding
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Validated repositories, reusable agent skills, license clearance, and funding accounts.
              </p>
            </div>

            {/* Research Items Panel */}
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-medium">
                DISCOVERED ARTIFACTS &amp; LICENSE PROVENANCE (PRD Sections 15–24):
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {researchItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 uppercase font-semibold">
                          {item.type}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {item.license} (Permitted)
                        </span>
                      </div>
                      <h4 className="heading-500 text-sm font-medium text-[var(--text-main)] mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs font-light text-[var(--text-main)] opacity-75 leading-relaxed mb-2">
                        {item.reason}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-mono opacity-65">
                      <span className="truncate max-w-[240px]">{item.source}</span>
                      <span className="uppercase text-blue-600 dark:text-blue-400 font-semibold">{item.decision}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Account Selection Section */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="heading-500 font-medium text-sm text-[var(--text-main)]">
                    Funding Account &amp; Failover Cascade
                  </h3>
                  <p className="text-xs font-light text-[var(--text-main)] opacity-70">
                    Auto-Mode prioritizes <strong>Antigravity #1</strong>, then <strong>OpenCode #2</strong>. Claude &amp; Codex are manual-only.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={selectAutoModeSequence}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shrink-0"
                >
                  ⚡ Auto Mode: Antigravity → OpenCode ({autoModeAccounts.length})
                </button>
              </div>

              {/* Execution Order Strip */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-main)] opacity-60 block">
                  EXECUTION CASCADE ({selectedAccounts.length} in pool):
                </span>
                <div className="space-y-1">
                  {selectedAccounts.map((acc, idx) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-[var(--text-main)]'
                        }`}>
                          {idx === 0 ? 'PRIMARY' : `BACKUP #${idx}`}
                        </span>
                        <span className="font-mono">{acc.displayAlias}</span>
                        <span className="opacity-50 font-mono uppercase">({acc.providerId})</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => moveAccountPriority(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveAccountPriority(idx, 'down')}
                          disabled={idx === selectedAccounts.length - 1}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-30 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(2)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Assessment</span>
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <span>Assemble Build Pack</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: BUILD PACK — Architecture, Customization & Sandbox                */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <Layers className="w-4 h-4" />
                <span>Build Pack &amp; Bootstrap</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Assemble Architecture &amp; Sandbox
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Review the customization strategy, sandbox isolation parameters, and Git checkpoint plan.
              </p>
            </div>

            {/* Build Pack Blueprint Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Architecture Blueprint */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                  ARCHITECTURE BLUEPRINT:
                </span>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                    <span className="opacity-60">Frontend:</span>
                    <span className="font-mono font-medium">{buildPack.architecture.frontend}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                    <span className="opacity-60">Backend / Engine:</span>
                    <span className="font-mono font-medium">{buildPack.architecture.backend}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/80">
                    <span className="opacity-60">Database / Cache:</span>
                    <span className="font-mono font-medium">{buildPack.architecture.database}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="opacity-60">AI Layer:</span>
                    <span className="font-mono font-medium text-blue-600 dark:text-blue-400">
                      Antigravity #1 → OpenCode #2
                    </span>
                  </div>
                </div>
              </div>

              {/* Customization & Originality Strategy */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                  CUSTOMIZATION STRATEGY (PRD Sections 30–31):
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                    <strong>Reused:</strong> {buildPack.implementationStrategy.reused.join(', ')}
                  </div>
                  <div className="p-2 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300">
                    <strong>Rewritten:</strong> {buildPack.implementationStrategy.rewritten.join(', ')}
                  </div>
                  <div className="p-2 rounded bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300">
                    <strong>Added Features:</strong> {buildPack.implementationStrategy.added.join(', ')}
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox & Checkpoint Plan */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                SANDBOX ISOLATION &amp; REVERSIBLE CHECKPOINTS:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Balanced Disposable Sandbox</span>
                    <span className="opacity-75 font-light">Host filesystems, SSH keys, and Docker sockets are strictly air-gapped.</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-start space-x-2">
                  <FolderGit2 className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">5 Staged Git Checkpoints</span>
                    <span className="opacity-75 font-light">Bootstrap → Research Pack → Core Feature → Testing → Polish.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Research</span>
              </button>
              <button
                onClick={() => setStep(5)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <span>Run Testing &amp; Auto-Fix</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: TESTING & AUTO-FIX — Multi-Layer QA Pipeline & Repair Loop        */}
        {/* ========================================================================= */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                <TestTube2 className="w-4 h-4" />
                <span>Multi-Layer Verification</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Testing Engine &amp; Auto-Fix Loop
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                "Never call a project working because the code exists. It is working only when the relevant tests and runtime checks pass."
              </p>
            </div>

            {/* 6 QA Verification Stage Cards */}
            <div className="space-y-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                VALIDATION PIPELINE STAGES (PRD Sections 35–46):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {testResults.map((t) => (
                  <div
                    key={t.testId}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-[var(--text-main)]">{t.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>PASS</span>
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-[var(--text-main)] opacity-60 mb-2 truncate">
                        $ {t.command}
                      </p>
                      <div className="space-y-1">
                        {t.evidence.map((ev, i) => (
                          <div key={i} className="text-[11px] font-light text-[var(--text-main)] opacity-80 flex items-start space-x-1.5">
                            <span className="text-emerald-500 font-mono">✓</span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 mt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-mono opacity-50">
                      <span>Category: {t.category.toUpperCase()}</span>
                      <span>{t.durationMs}ms</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bounded Auto-Fix Repair Log */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 text-xs font-mono uppercase tracking-wider font-semibold">
                <Bug className="w-4 h-4" />
                <span>Auto-Fix Repair Loop (Bounded to 5 Cycles)</span>
              </div>
              <div className="space-y-2 text-xs">
                {repairHistory.map((rep) => (
                  <div
                    key={rep.attemptNumber}
                    className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/60 space-y-1"
                  >
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        Repair Cycle #{rep.attemptNumber} — Auto-Resolved
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold uppercase">✓ Verified</span>
                    </div>
                    <p className="font-light text-[var(--text-main)] opacity-80">
                      <strong>Failure:</strong> {rep.failure}
                    </p>
                    <p className="font-light text-[var(--text-main)] opacity-80">
                      <strong>Patch Applied:</strong> {rep.change}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Step Navigation Bar */}
            <div className="pt-4 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setStep(4)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm paragraph-300 font-light text-[var(--text-main)] opacity-70 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Build Pack</span>
              </button>
              <button
                onClick={() => setStep(6)}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-xs"
              >
                <span>Proceed to Delivery &amp; Working Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: DELIVERY — Working Project Authorization & Package Verification   */}
        {/* ========================================================================= */}
        {step === 6 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Working Project Package</span>
              </div>
              <h2 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
                Final Delivery &amp; Authorization
              </h2>
              <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
                Verified working software package with complete provenance, test certificates, and execution intent.
              </p>
            </div>

            {/* Working Project Summary Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 border border-emerald-500/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase bg-emerald-600 text-white font-bold tracking-wider">
                      STATUS: READY ✅
                    </span>
                    <span className="text-xs font-mono opacity-60">Definition of Done Verified</span>
                  </div>
                  <h3 className="heading-500 text-xl font-medium text-[var(--text-main)]">
                    {projectPackage.sourceManifest.project as string}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono text-[var(--text-main)] opacity-60 block">Execution Target</span>
                  <span className="text-sm font-mono font-medium text-emerald-600 dark:text-emerald-400">
                    $ {projectPackage.runCommand}
                  </span>
                </div>
              </div>

              {/* Package Deliverables Manifest */}
              <div className="space-y-2 pt-2 border-t border-emerald-500/20">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                  DELIVERY PACKAGE MANIFESTS:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                  {['README.md', 'ARCHITECTURE.md', 'TESTING.md', 'SECURITY.md', 'SOURCES.md', 'LICENSES.md'].map((doc) => (
                    <div
                      key={doc}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center space-x-2 text-[var(--text-main)]"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funding Safety Statement */}
              <div className="space-y-2 pt-2">
                <p className="text-xs leading-relaxed bg-white dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  🛡️ <strong>Sandbox Safety Statement:</strong> Project executes inside an isolated disposable sandbox. Host filesystems, SSH keys, and external ports remain protected.
                </p>

                {selectedAccounts.some((a) => a.providerId === 'claude' || a.providerId === 'codex') ? (
                  <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                    ℹ️ <strong>Manual Opt-In Detected:</strong> This execution pool includes manual-only account(s) (Claude / Codex) explicitly checked by you.
                  </p>
                ) : (
                  <p className="text-xs text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 p-3 rounded-xl border border-cyan-200 dark:border-cyan-800">
                    ⚡ <strong>Auto-Mode Active:</strong> Execution uses <strong>Antigravity</strong> first, then <strong>OpenCode</strong>. Claude and Codex subscriptions are strictly preserved for manual use.
                  </p>
                )}
              </div>

              {/* Primary Authorization CTA */}
              <div className="pt-2">
                <button
                  onClick={handleFinalRunJob}
                  className="w-full py-4 rounded-xl text-base font-medium uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/20 transition transform active:scale-[0.98] cursor-pointer flex items-center justify-center space-x-3"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>AUTHORIZE &amp; RUN WORKING PROJECT</span>
                </button>
              </div>
            </div>

            {/* Bottom Return Bar */}
            <div className="flex justify-between items-center text-xs paragraph-300 font-light text-[var(--text-main)] opacity-70">
              <button
                onClick={() => setStep(5)}
                className="flex items-center space-x-1 hover:opacity-100 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Testing</span>
              </button>
              <span>Hash-bound ExecutionIntent will be persisted on authorization.</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
