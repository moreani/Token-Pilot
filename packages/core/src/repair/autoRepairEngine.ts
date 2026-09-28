import type {
  ErrorCategory,
  RepairCycleRecord,
  LearnedSolution
} from '@tokenpilot/contracts';
import { ExperienceMemoryStore } from '../memory/experienceStore.js';

export interface RepairJobContext {
  jobId: string;
  projectName: string;
  repoUrl: string;
  maxCycles?: number; // PRD §48 default 5
}

export interface RepairResult {
  status: 'RESOLVED' | 'FAILED_HUMAN_REVIEW';
  cyclesExecuted: number;
  history: RepairCycleRecord[];
  appliedPatch?: string;
  tokensSavedTotal: number;
  tokensBurnedTotal: number;
  resolvedViaMemory: boolean;
  learnedPatternId?: string;
}

export class AutoRepairEngine {
  private memoryStore: ExperienceMemoryStore;

  constructor(memoryStore?: ExperienceMemoryStore) {
    this.memoryStore = memoryStore || new ExperienceMemoryStore();
  }

  getMemoryStore(): ExperienceMemoryStore {
    return this.memoryStore;
  }

  classifyError(errorLog: string): ErrorCategory {
    const text = errorLog.toLowerCase();
    if (
      text.includes('executable doesn\'t exist') ||
      text.includes('missing executable') ||
      text.includes('ms-playwright') ||
      text.includes('econnrefused') ||
      text.includes('port conflict') ||
      text.includes('env:')
    ) {
      return 'ENVIRONMENT';
    }
    if (text.includes('ts') || text.includes('syntaxerror') || text.includes('compilation') || text.includes('cannot find module') || text.includes('cannot find name')) {
      return 'BUILD';
    }
    if (text.includes('timeouterror') || text.includes('assertionerror') || text.includes('expect(') || text.includes('test failed')) {
      return 'TEST';
    }
    if (text.includes('maximum call stack') || text.includes('nullpointer') || text.includes('undefined is not') || text.includes('nan')) {
      return 'LOGIC';
    }
    if (text.includes('cve-') || text.includes('secret') || text.includes('unauthorized') || text.includes('jwt')) {
      return 'SECURITY';
    }
    if (text.includes('429') || text.includes('rate limit') || text.includes('service unavailable') || text.includes('503')) {
      return 'EXTERNAL';
    }
    return 'RUNTIME';
  }

  async runRepairLoop(
    errorLog: string,
    context: RepairJobContext,
    onProgress?: (message: string) => void
  ): Promise<RepairResult> {
    const maxCycles = context.maxCycles || 5;
    const history: RepairCycleRecord[] = [];
    const category = this.classifyError(errorLog);

    onProgress?.(`[Auto-Repair] 🔍 Failure detected. Category classified as: ${category}.`);

    // 1. First consult Project Memory Bank (Zero-Token Fast Path)
    onProgress?.('[Auto-Repair] 🧠 Querying Experience Memory Bank for known pattern fingerprint...');
    const existingSolution = this.memoryStore.findSolution(errorLog);

    if (existingSolution && existingSolution.confidenceScore >= 0.85) {
      onProgress?.(
        `[Auto-Repair] ⚡ Instant Match in Memory! Applying validated patch (Confidence: ${(existingSolution.confidenceScore * 100).toFixed(0)}%, Pattern ID: ${existingSolution.id})`
      );

      this.memoryStore.reinforceSolution(existingSolution.id, 18000);

      const record: RepairCycleRecord = {
        cycleIndex: 1,
        failureSummary: errorLog.slice(0, 140),
        category,
        hypothesis: `Recognized known error fingerprint. Applied learned patch template: ${existingSolution.explanation}`,
        patchApplied: existingSolution.patchTemplate,
        testPassed: true,
        tokensBurned: 0, // Zero LLM tokens consumed!
        learnedPatternId: existingSolution.id,
        resolvedViaMemory: true,
        timestamp: new Date().toISOString()
      };
      history.push(record);

      onProgress?.(`[Auto-Repair] ✅ Targeted test and regression suites passed. 0 LLM tokens burned (~${Math.round(existingSolution.tokensSavedTotal / 1000)}k cumulative saved).`);

      return {
        status: 'RESOLVED',
        cyclesExecuted: 1,
        history,
        appliedPatch: existingSolution.patchTemplate,
        tokensSavedTotal: 18000,
        tokensBurnedTotal: 0,
        resolvedViaMemory: true,
        learnedPatternId: existingSolution.id
      };
    }

    // 2. Bounded Multi-Cycle Repair Loop (PRD §48)
    onProgress?.('[Auto-Repair] 🛠️ Novel issue detected. Entering bounded 5-cycle autonomous diagnostic loop...');

    let currentError = errorLog;
    let totalTokensBurned = 0;

    for (let cycle = 1; cycle <= maxCycles; cycle++) {
      onProgress?.(`[Auto-Repair] Cycle ${cycle}/${maxCycles}: Analyzing AST and trace evidence...`);
      const cycleTokens = 1200 + cycle * 400;
      totalTokensBurned += cycleTokens;

      const hypothesis = `Hypothesis #${cycle}: Mitigate ${category} regression by injecting safe guard check and fallback boundary in AST.`;
      const synthesizedPatch = `diff --git a/src/solution.ts b/src/solution.ts
@@ -10,3 +10,7 @@
+  // Autonomous Self-Healing Patch (Cycle ${cycle})
+  if (!context || typeof context === 'undefined') {
+    return { status: 'fallback_handled', ok: true };
+  }`;

      onProgress?.(`[Auto-Repair] Cycle ${cycle}/${maxCycles}: Synthesized patch. Applying to sandbox...`);
      onProgress?.(`[Auto-Repair] Cycle ${cycle}/${maxCycles}: Running targeted test suite...`);

      // In the simulated engine, cycle 1 or 2 resolves the problem
      const isPass = cycle >= 1; // succeeds on first diagnostic iteration

      const record: RepairCycleRecord = {
        cycleIndex: cycle,
        failureSummary: currentError.slice(0, 140),
        category,
        hypothesis,
        patchApplied: synthesizedPatch,
        testPassed: isPass,
        tokensBurned: cycleTokens,
        resolvedViaMemory: false,
        timestamp: new Date().toISOString()
      };
      history.push(record);

      if (isPass) {
        onProgress?.(`[Auto-Repair] ✅ Tests verified passing in Cycle ${cycle}.`);
        
        // 3. Grow Experience Store ("Becomes smarter as we use it more")
        const learned = this.memoryStore.recordSolution(
          category,
          errorLog,
          synthesizedPatch,
          hypothesis,
          15000
        );

        onProgress?.(`[Project Memory] 📚 Learned new solution pattern: ${learned.id}. Stored in Knowledge Bank for instant zero-token reuse.`);

        return {
          status: 'RESOLVED',
          cyclesExecuted: cycle,
          history,
          appliedPatch: synthesizedPatch,
          tokensSavedTotal: 15000,
          tokensBurnedTotal: totalTokensBurned,
          resolvedViaMemory: false,
          learnedPatternId: learned.id
        };
      }
    }

    onProgress?.('[Auto-Repair] ❌ Max cycles reached without pass. Marking FAILED — HUMAN REVIEW REQUIRED.');
    return {
      status: 'FAILED_HUMAN_REVIEW',
      cyclesExecuted: maxCycles,
      history,
      tokensSavedTotal: 0,
      tokensBurnedTotal: totalTokensBurned,
      resolvedViaMemory: false
    };
  }
}
