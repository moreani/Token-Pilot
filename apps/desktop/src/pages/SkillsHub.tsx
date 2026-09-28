import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Search,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode2,
  ExternalLink,
  Terminal,
  RefreshCw
} from 'lucide-react';

export interface AcceleratorSkill {
  id: string;
  name: string;
  type: 'local' | 'community';
  category: 'architecture' | 'security' | 'testing' | 'automation' | 'developer_tools';
  speedup: string;
  description: string;
  repoUrl?: string;
  capabilities: string[];
  suggestedJobType: 'repo_lab' | 'graphify_dossier' | 'security_audit' | 'test_booster';
  defaultObjective: string;
}

const ACCELERATOR_SKILLS: AcceleratorSkill[] = [
  {
    id: 'graphify',
    name: 'Graphify (AST & Knowledge Graph)',
    type: 'local',
    category: 'architecture',
    speedup: '4.8x faster exploration',
    description: 'Turns codebases, dependencies, and file relationships into an interactive persistent knowledge graph. Quickly pinpoints God Nodes and community clusters without reading entire repos.',
    repoUrl: 'https://github.com/moreani/Token-Pilot',
    capabilities: ['AST Parsing', 'Community Detection', 'Mermaid Diagrams', 'Sub-graph extraction'],
    suggestedJobType: 'graphify_dossier',
    defaultObjective: 'Extract architectural knowledge graph, god nodes, and component relationship map using Graphify'
  },
  {
    id: 'ast-audit',
    name: 'AST Fast-Track Inspector',
    type: 'community',
    category: 'architecture',
    speedup: '3.2x faster setup',
    description: 'Rapid structural inspection engine that reads abstract syntax trees directly, skipping manual boilerplate scanning and discovering exported interfaces immediately.',
    repoUrl: 'https://github.com/facebook/react',
    capabilities: ['Syntax Tree Traversal', 'Export Graphing', 'Dead Code Detection'],
    suggestedJobType: 'repo_lab',
    defaultObjective: 'Investigate architecture, dependencies, and identify potential modernization tasks'
  },
  {
    id: 'code-guard',
    name: 'CodeGuard & CVE Hunter',
    type: 'community',
    category: 'security',
    speedup: '5.0x faster audit',
    description: 'Autonomous zero-trust audit tool scouting hardcoded secrets, insecure API calls, dependency vulnerabilities, and permissive sandbox holes.',
    capabilities: ['Dependency Audit', 'Secret Scanning', 'CVE Database Lookups', 'Permissive Scope Check'],
    suggestedJobType: 'security_audit',
    defaultObjective: 'Audit dependencies for known CVEs, scan source for exposed secrets, and verify sandbox policies'
  },
  {
    id: 'test-booster',
    name: 'Autonomous Test Suite Booster',
    type: 'community',
    category: 'testing',
    speedup: '2.9x faster coverage',
    description: 'Scouts uncovered functions and edge cases in the target repository and automatically synthesizes deterministic unit tests matching framework conventions.',
    capabilities: ['Branch Analysis', 'Mock Generation', 'Snapshot Assertions', 'Coverage Scoring'],
    suggestedJobType: 'test_booster',
    defaultObjective: 'Discover untested modules, analyze edge cases, and synthesize targeted unit test suites'
  },
  {
    id: 'app-media-recorder',
    name: 'App Media Recorder & Playwright',
    type: 'local',
    category: 'automation',
    speedup: 'Pixel-perfect recordings',
    description: 'Captures desktop and mobile screenshots and records tight-framed 1:1 WebM walkthroughs of web applications using headless browser automation without grey borders.',
    capabilities: ['Playwright Chromium', 'WebM Video Capture', 'Responsive Viewports', 'Zero Margin Frames'],
    suggestedJobType: 'repo_lab',
    defaultObjective: 'Launch local server in disposable container and capture visual walkthrough screenshots'
  },
  {
    id: 'generative-ui',
    name: 'Generative UI & Widget Renderer',
    type: 'local',
    category: 'developer_tools',
    speedup: 'Instant visualization',
    description: 'Renders rich interactive HTML widgets, telemetry charts, and reactive control panels inline for instant visual verification of complex outputs.',
    capabilities: ['KaTeX Math', 'Mermaid Diagrams', 'Inline SVG', 'Tailwind Controls'],
    suggestedJobType: 'graphify_dossier',
    defaultObjective: 'Generate interactive visual telemetry panels and Mermaid flowcharts for the target architecture'
  },
  {
    id: 'agy-customizations',
    name: 'Antigravity Skill & MCP Bridge',
    type: 'local',
    category: 'developer_tools',
    speedup: 'Native protocol binding',
    description: 'Standardized engine for discovering, registering, and dynamically hot-reloading native subagent skills, sidecars, and Model Context Protocol (MCP) server endpoints.',
    capabilities: ['MCP Server Discovery', 'Sidecar Linking', 'Tool Schema Compilation'],
    suggestedJobType: 'repo_lab',
    defaultObjective: 'Examine repository tools and compile custom Model Context Protocol (MCP) tool schemas'
  },
  {
    id: 'migrate-workflows',
    name: 'Workflow to Modern Skill Migrator',
    type: 'local',
    category: 'automation',
    speedup: 'Zero-manual refactor',
    description: 'Scans legacy configuration scripts and automatically converts them into modern declarative SKILL.md specs with structured frontmatter and verified tool permissions.',
    capabilities: ['Legacy Script Parsing', 'YAML Frontmatter Generation', 'Safe Archive'],
    suggestedJobType: 'repo_lab',
    defaultObjective: 'Scan legacy build and CI workflows and migrate them into modern agent skills'
  }
];

interface SkillsHubProps {
  onLaunchJobWithSkill: (skill: AcceleratorSkill) => void;
}

export const SkillsHub: React.FC<SkillsHubProps> = ({ onLaunchJobWithSkill }) => {
  const [skills, setSkills] = useState<AcceleratorSkill[]>(ACCELERATOR_SKILLS);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'local' | 'community'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchFreshAccelerators = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/accelerators');
      if (res.ok) {
        const data = await res.json();
        if (data.ok && Array.isArray(data.skills) && data.skills.length > 0) {
          setSkills(data.skills);
        }
      }
      setLastRefreshedAt(Date.now());
    } catch (err) {
      console.warn('Failed to fetch dynamic accelerators:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFreshAccelerators();
  }, [fetchFreshAccelerators]);

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.capabilities.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || skill.type === filterType;
    const matchesCategory = categoryFilter === 'all' || skill.category === categoryFilter;

    return matchesSearch && matchesType && matchesCategory;
  });

  const localCount = skills.filter((s) => s.type === 'local').length;
  const communityCount = skills.filter((s) => s.type === 'community').length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/20 mb-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-blue-400">
                Stage 1 Accelerator Registry
              </span>
            </div>
            <h1 className="heading-500 text-2xl font-medium tracking-tight text-[var(--text-main)]">
              Agent Skills &amp; Repository Accelerators
            </h1>
            <p className="paragraph-300 text-xs mt-1 max-w-2xl font-light text-[var(--text-main)] opacity-80 leading-relaxed">
              TokenPilot automatically scouts existing community repositories and agent skills during <strong>Stage 1 (First Work)</strong> of every job. Browse verified local tools and community accelerators below, or attach one directly to your next run.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur text-center">
              <div className="text-lg font-mono font-medium text-emerald-400">{localCount}</div>
              <div className="text-[10px] uppercase font-mono opacity-70">Local Tools</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur text-center">
              <div className="text-lg font-mono font-medium text-blue-400">{communityCount}</div>
              <div className="text-[10px] uppercase font-mono opacity-70">Accelerators</div>
            </div>

            <div className="flex flex-col items-end">
              <button
                onClick={fetchFreshAccelerators}
                disabled={isRefreshing}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isRefreshing
                    ? 'bg-white/10 border-white/20 opacity-60 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 border-white/20 active:scale-95'
                } text-white backdrop-blur shadow-xs`}
                title="Scan local disk and community registry for fresh accelerators"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Scanning…' : 'Refresh Registry'}</span>
              </button>
              {lastRefreshedAt && !isRefreshing && (
                <span className="text-[10px] opacity-60 mt-1 font-mono text-blue-200">
                  Updated just now
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills, tools, AST, security, graph..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-light text-[var(--text-main)] placeholder-slate-400 focus:outline-none focus:border-blue-500 transition shadow-xs"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            All Tools ({ACCELERATOR_SKILLS.length})
          </button>
          <button
            onClick={() => setFilterType('local')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterType === 'local'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Local Machine ({localCount})
          </button>
          <button
            onClick={() => setFilterType('community')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              filterType === 'community'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[var(--text-main)] hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Community Accelerators ({communityCount})
          </button>
        </div>
      </div>

      {/* Grid of Accelerator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSkills.map((skill) => {
          const isLocal = skill.type === 'local';
          return (
            <div
              key={skill.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header: Badge & Speed Advantage */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-medium border ${
                      isLocal
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800/60'
                    }`}
                  >
                    {isLocal ? 'Installed Local' : 'Community Fast-Track'}
                  </span>
                  <span className="flex items-center space-x-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{skill.speedup}</span>
                  </span>
                </div>

                {/* Title */}
                <h3 className="heading-500 text-base font-medium text-[var(--text-main)] tracking-tight">
                  {skill.name}
                </h3>

                {/* Description */}
                <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-75 mt-2 leading-relaxed">
                  {skill.description}
                </p>

                {/* Capabilities Pills */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {skill.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[var(--text-main)] opacity-80 border border-slate-200 dark:border-slate-700/60"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer: Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono opacity-50 uppercase">
                  Stage 1 Ready
                </span>
                <button
                  onClick={() => onLaunchJobWithSkill(skill)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Launch Job</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
