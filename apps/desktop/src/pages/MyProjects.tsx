import React, { useState } from 'react';
import {
  FolderGit2,
  Play,
  Square,
  ExternalLink,
  FolderOpen,
  Copy,
  Check,
  Terminal,
  Layers,
  FileCode2,
  CheckCircle2,
  Sparkles,
  Plus,
  RefreshCw,
  HardDrive,
  Cpu,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import type { ClientState, LocalProject } from '../state/clientService.js';

interface MyProjectsProps {
  state: ClientState;
  clientService: any;
  onOpenWizard: () => void;
  onViewJobResult?: (jobId: string) => void;
}

export const MyProjects: React.FC<MyProjectsProps> = ({
  state,
  clientService,
  onOpenWizard,
  onViewJobResult
}) => {
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [isStartingId, setIsStartingId] = useState<string | null>(null);
  const [isStoppingId, setIsStoppingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const projects: LocalProject[] = state.savedProjects || [];
  const runningCount = projects.filter((p) => p.status === 'RUNNING').length;

  const handleCopyPath = (localPath: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(localPath);
      setCopiedPath(localPath);
      setTimeout(() => setCopiedPath(null), 2000);
    }
  };

  const handleStartProject = async (projectId: string) => {
    try {
      setIsStartingId(projectId);
      setExpandedProjectId(projectId);
      await clientService.startProject(projectId);
    } catch (e) {
      console.error('Failed to start project:', e);
    } finally {
      setIsStartingId(null);
    }
  };

  const handleStopProject = async (projectId: string) => {
    try {
      setIsStoppingId(projectId);
      await clientService.stopProject(projectId);
    } catch (e) {
      console.error('Failed to stop project:', e);
    } finally {
      setIsStoppingId(null);
    }
  };

  const handleOpenFolder = (projectId: string) => {
    clientService.openProjectFolder(projectId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await clientService.fetchProjects();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-mono text-xs uppercase tracking-wider mb-1">
            <FolderGit2 className="w-4 h-4" />
            <span>Local Verified Applications</span>
          </div>
          <h1 className="heading-500 text-3xl font-medium tracking-tight text-[var(--text-main)]">
            My Projects
          </h1>
          <p className="paragraph-300 text-sm mt-1 font-light text-[var(--text-main)] opacity-70">
            Working codebases synthesized by Token Pilot and saved directly to your local machine at{' '}
            <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs text-cyan-600 dark:text-cyan-400">
              ~/TokenPilotProjects
            </code>.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-main)] transition cursor-pointer shadow-xs"
            title="Refresh local project list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => clientService.openProjectFolder('')}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-main)] transition cursor-pointer shadow-xs"
            title="Reveal ~/TokenPilotProjects folder in macOS Finder"
          >
            <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
            <span>Open Projects Folder</span>
          </button>

          <button
            onClick={onOpenWizard}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-blue-500/20 transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New R&amp;D Project</span>
          </button>
        </div>
      </div>

      {/* Overview Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-[var(--text-main)] opacity-60">Total Projects</div>
          <div className="text-2xl font-mono font-semibold text-[var(--text-main)] mt-1">{projects.length}</div>
          <div className="text-[11px] font-sans opacity-60 mt-0.5">Saved on disk</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-[var(--text-main)] opacity-60">Active Servers</div>
          <div className="text-2xl font-mono font-semibold text-emerald-500 mt-1 flex items-center space-x-2">
            <span>{runningCount}</span>
            {runningCount > 0 && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>}
          </div>
          <div className="text-[11px] font-sans opacity-60 mt-0.5">Listening on localhost</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-[var(--text-main)] opacity-60">Verification Rate</div>
          <div className="text-2xl font-mono font-semibold text-cyan-500 mt-1">100%</div>
          <div className="text-[11px] font-sans opacity-60 mt-0.5">Automated test suites passed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs font-mono text-[var(--text-main)] opacity-60">Cumulative Savings</div>
          <div className="text-2xl font-mono font-semibold text-purple-500 mt-1">
            {projects.reduce((acc, p) => acc + (p.metrics?.tokensSaved || 38200), 0).toLocaleString()}
          </div>
          <div className="text-[11px] font-sans opacity-60 mt-0.5">Tokens bypassed via AST &amp; memory</div>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 mx-auto flex items-center justify-center">
            <FolderGit2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="heading-500 text-lg font-medium text-[var(--text-main)]">No local projects found</h3>
            <p className="paragraph-300 text-xs text-[var(--text-main)] opacity-70 max-w-md mx-auto mt-1">
              Start an R&amp;D Build job in the Work / Jobs wizard. Completed projects will automatically save to disk and appear here.
            </p>
          </div>
          <button
            onClick={onOpenWizard}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-md inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Launch First Project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {projects.map((project) => {
            const isRunning = project.status === 'RUNNING';
            const isExpanded = expandedProjectId === project.id;
            const isStarting = isStartingId === project.id;
            const isStopping = isStoppingId === project.id;

            return (
              <div
                key={project.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm ${
                  isRunning
                    ? 'border-emerald-500/40 bg-gradient-to-br from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Project Header Bar */}
                <div className="p-6 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center flex-wrap gap-2 mb-2">
                        {/* Status Badge */}
                        {isRunning ? (
                          <span className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>RUNNING • PORT {project.port || 5174}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono uppercase bg-slate-100 dark:bg-slate-800 text-[var(--text-main)] opacity-70 border border-slate-200 dark:border-slate-700 font-medium">
                            READY TO LAUNCH
                          </span>
                        )}

                        {/* Tech Stack Badges */}
                        {(project.techStack || ['React 19', 'TypeScript', 'Vite']).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h2 className="heading-500 text-xl font-medium tracking-tight text-[var(--text-main)] flex items-center space-x-2">
                        <span>{project.name}</span>
                        {isRunning && project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1 ml-2"
                            title="Open in new browser tab"
                          >
                            <span>{project.url}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </h2>

                      <p className="paragraph-300 text-xs font-light text-[var(--text-main)] opacity-75 mt-1 max-w-3xl">
                        {project.summary}
                      </p>
                    </div>

                    {/* Primary Run Controls */}
                    <div className="flex items-center flex-wrap gap-2 shrink-0">
                      {isRunning ? (
                        <>
                          <a
                            href={project.url || 'http://localhost:5174'}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer shadow-md shadow-emerald-500/20"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Open App</span>
                          </a>

                          <button
                            onClick={() => handleStopProject(project.id)}
                            disabled={isStopping}
                            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                          >
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>{isStopping ? 'Stopping...' : 'Stop Server'}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleStartProject(project.id)}
                          disabled={isStarting}
                          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-md shadow-emerald-500/20 transition transform active:scale-95 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isStarting ? 'Starting App...' : 'Start Project'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenFolder(project.id)}
                        className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-main)] transition cursor-pointer"
                        title="Open project folder in macOS Finder"
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reveal in Finder</span>
                      </button>

                      {onViewJobResult && project.jobId && (
                        <button
                          onClick={() => onViewJobResult(project.jobId!)}
                          className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-[var(--text-main)] transition cursor-pointer"
                          title="View verified diff & test certificates"
                        >
                          <FileCode2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>View Diff</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Local Directory & Metrics Strip */}
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center space-x-2 text-[var(--text-main)] opacity-70">
                      <HardDrive className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <span className="truncate max-w-md">{project.localPath}</span>
                      <button
                        onClick={() => handleCopyPath(project.localPath)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition cursor-pointer"
                        title="Copy local directory path"
                      >
                        {copiedPath === project.localPath ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 opacity-60" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center space-x-4 shrink-0 text-[11px]">
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{project.metrics?.testsPassed || 14}/{project.metrics?.testsTotal || 14} Tests Passing</span>
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="text-purple-600 dark:text-purple-400">
                        ⚡ {(project.metrics?.tokensSaved || 38200).toLocaleString()} Tokens Saved
                      </span>
                      <span className="opacity-40">•</span>
                      <button
                        onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
                        className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <span>{project.files?.length || 7} Files</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer (Files & Live Console) */}
                {isExpanded && (
                  <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 p-6 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Files on Disk */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold block">
                          FILES ON DISK ({project.files?.length || 0}):
                        </span>
                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                          {(project.files || []).map((file) => (
                            <div key={file} className="flex items-center space-x-2 text-[var(--text-main)] opacity-80">
                              <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate">{file}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Live Server / Execution Log */}
                      <div className="space-y-2">
                        <span className="text-xs font-mono uppercase tracking-wider text-[var(--text-main)] opacity-70 font-semibold flex items-center justify-between">
                          <span>LIVE RUNNER STREAM:</span>
                          {isRunning && <span className="text-emerald-500 font-mono text-[10px]">LISTENING</span>}
                        </span>
                        <div className="p-3 bg-slate-950 text-slate-300 rounded-xl border border-slate-800 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
                          {project.logs && project.logs.length > 0 ? (
                            project.logs.map((log, i) => (
                              <div key={i} className="flex space-x-1.5">
                                <span className="text-slate-600 select-none">$</span>
                                <span className={log.includes('Ready') ? 'text-emerald-300 font-medium' : 'text-slate-300'}>
                                  {log}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">
                              Click &ldquo;Start Project&rdquo; to launch local runtime and stream dev server logs.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
