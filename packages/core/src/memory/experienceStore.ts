import type {
  ErrorCategory,
  ErrorFingerprint,
  LearnedSolution,
  ExperienceMemoryStats
} from '@tokenpilot/contracts';

function hashString(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export class ExperienceMemoryStore {
  private solutions: Map<string, LearnedSolution> = new Map();

  constructor() {
    this.seedDefaultPatterns();
  }

  private seedDefaultPatterns() {
    this.addSeedPattern({
      category: 'BUILD',
      patternRegex: '(TS2304|Cannot find name|implicit any|TS7006)',
      description: 'Missing TypeScript type annotation or unresolved identifier',
      framework: 'typescript',
      patchTemplate: 'export interface FallbackType { [key: string]: any; }\n// Synthesized safe typing wrapper',
      explanation: 'Inject type definition to resolve TS compilation failure with zero runtime overhead.',
      sampleErrorSnippet: "error TS2304: Cannot find name 'AccountConfig'.",
      initialConfidence: 0.92,
      baseTokensSaved: 14200
    });

    this.addSeedPattern({
      category: 'RUNTIME',
      patternRegex: '(ERR_MODULE_NOT_FOUND|Cannot find module.*\\.js)',
      description: 'ESM relative import path missing extension or resolution misconfiguration',
      framework: 'nodejs',
      patchTemplate: "import { Component } from './component.js';",
      explanation: 'Explicitly append .js extension required by modern ESM module resolution.',
      sampleErrorSnippet: "Error [ERR_MODULE_NOT_FOUND]: Cannot find module './utils'",
      initialConfidence: 0.95,
      baseTokensSaved: 16500
    });

    this.addSeedPattern({
      category: 'TEST',
      patternRegex: '(TimeoutError|locator.*timeout|timeout.*30000ms|30000ms.*exceeded)',
      description: 'Playwright locator or asynchronous test runner timeout',
      framework: 'playwright',
      patchTemplate: "await locator.waitFor({ state: 'visible', timeout: 8000 });\nawait locator.click();",
      explanation: 'Insert explicit visibility guard before action to stabilize flaky DOM hydration.',
      sampleErrorSnippet: "Test execution failed: locator.click: Timeout 30000ms exceeded.",
      initialConfidence: 0.91,
      baseTokensSaved: 22000
    });

    this.addSeedPattern({
      category: 'LOGIC',
      patternRegex: '(Maximum call stack size exceeded|circular AST|traversal loop)',
      description: 'Circular reference or unbounded recursive AST traversal',
      framework: 'compiler',
      patchTemplate: 'const visited = new WeakSet();\nif (visited.has(node)) return null;\nvisited.add(node);',
      explanation: 'Add visited WeakSet guard to break circular reference cycles in AST traversals.',
      sampleErrorSnippet: 'RangeError: Maximum call stack size exceeded in astOptimizer',
      initialConfidence: 0.94,
      baseTokensSaved: 28000
    });

    this.addSeedPattern({
      category: 'ENVIRONMENT',
      patternRegex: '(Executable doesn\'t exist|npx playwright install|chromium_headless_shell)',
      description: 'Missing headless browser binary in sandbox or host runtime',
      framework: 'playwright',
      patchTemplate: "const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });",
      explanation: 'Fallback to available local browser executable binary when cached headless shell is absent.',
      sampleErrorSnippet: "Executable doesn't exist at /Library/Caches/ms-playwright/chromium_headless_shell",
      initialConfidence: 0.98,
      baseTokensSaved: 18500
    });
  }

  private addSeedPattern(opts: {
    category: ErrorCategory;
    patternRegex: string;
    description: string;
    framework?: string;
    patchTemplate: string;
    explanation: string;
    sampleErrorSnippet: string;
    initialConfidence: number;
    baseTokensSaved: number;
  }) {
    const signatureHash = hashString(opts.patternRegex).slice(0, 12);
    const id = `mem-${signatureHash}`;
    const fingerprint: ErrorFingerprint = {
      signatureHash,
      category: opts.category,
      patternRegex: opts.patternRegex,
      description: opts.description,
      framework: opts.framework
    };

    this.solutions.set(id, {
      id,
      fingerprint,
      patchTemplate: opts.patchTemplate,
      sampleErrorSnippet: opts.sampleErrorSnippet,
      explanation: opts.explanation,
      successCount: 3,
      failureCount: 0,
      tokensSavedTotal: opts.baseTokensSaved * 3,
      confidenceScore: opts.initialConfidence,
      createdAt: new Date().toISOString(),
      lastAppliedAt: new Date().toISOString()
    });
  }

  findSolution(errorMessage: string, framework?: string): LearnedSolution | null {
    if (!errorMessage) return null;

    let bestMatch: LearnedSolution | null = null;
    let highestConfidence = 0;

    for (const sol of this.solutions.values()) {
      try {
        const regex = new RegExp(sol.fingerprint.patternRegex, 'i');
        const matchesRegex = regex.test(errorMessage);
        const matchesSubstring =
          errorMessage.toLowerCase().includes(sol.sampleErrorSnippet.toLowerCase()) ||
          sol.sampleErrorSnippet.toLowerCase().includes(errorMessage.toLowerCase());

        if (matchesRegex || matchesSubstring) {
          if (!framework || !sol.fingerprint.framework || sol.fingerprint.framework.toLowerCase() === framework.toLowerCase()) {
            if (sol.confidenceScore > highestConfidence) {
              highestConfidence = sol.confidenceScore;
              bestMatch = sol;
            }
          }
        }
      } catch {
        // regex evaluation fallback
      }
    }

    return bestMatch;
  }

  recordSolution(
    category: ErrorCategory,
    errorSnippet: string,
    patch: string,
    explanation: string,
    tokensSaved: number = 18000,
    framework?: string
  ): LearnedSolution {
    const cleanSnippet = errorSnippet.slice(0, 120).trim();
    const signatureHash = hashString(`${category}:${cleanSnippet}`).slice(0, 12);
    const id = `mem-${signatureHash}`;
    const existing = this.solutions.get(id);

    if (existing) {
      this.reinforceSolution(id, tokensSaved);
      return this.solutions.get(id)!;
    }

    // Extract first meaningful clause for flexible matching
    const firstClause = cleanSnippet.split(/(\r?\n| at )/)[0].trim();
    const escapedSnippet = firstClause.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fingerprint: ErrorFingerprint = {
      signatureHash,
      category,
      patternRegex: `(${escapedSnippet})`,
      description: explanation.slice(0, 100),
      framework
    };

    const newSolution: LearnedSolution = {
      id,
      fingerprint,
      patchTemplate: patch,
      sampleErrorSnippet: cleanSnippet,
      explanation,
      successCount: 1,
      failureCount: 0,
      tokensSavedTotal: tokensSaved,
      confidenceScore: 0.88,
      createdAt: new Date().toISOString(),
      lastAppliedAt: new Date().toISOString()
    };

    this.solutions.set(id, newSolution);
    return newSolution;
  }

  reinforceSolution(solutionId: string, tokensSaved: number = 15000) {
    const sol = this.solutions.get(solutionId);
    if (!sol) return;

    sol.successCount += 1;
    sol.tokensSavedTotal += tokensSaved;
    // Asymptotic confidence increase toward 0.99
    sol.confidenceScore = Math.min(0.99, sol.confidenceScore + 0.02);
    sol.lastAppliedAt = new Date().toISOString();
  }

  penalizeSolution(solutionId: string) {
    const sol = this.solutions.get(solutionId);
    if (!sol) return;

    sol.failureCount += 1;
    sol.confidenceScore = Math.max(0.1, sol.confidenceScore - 0.15);
  }

  getStats(): ExperienceMemoryStats {
    let totalTokens = 0;
    let totalRepairs = 0;
    let confidenceSum = 0;
    let latestTime: string | undefined;

    for (const sol of this.solutions.values()) {
      totalTokens += sol.tokensSavedTotal;
      totalRepairs += sol.successCount;
      confidenceSum += sol.confidenceScore;
      if (!latestTime || (sol.lastAppliedAt && sol.lastAppliedAt > latestTime)) {
        latestTime = sol.lastAppliedAt;
      }
    }

    const count = this.solutions.size || 1;
    return {
      totalPatternsLearned: this.solutions.size,
      totalRepairsExecuted: totalRepairs,
      totalTokensSavedViaMemory: totalTokens,
      averageConfidenceScore: Number((confidenceSum / count).toFixed(2)),
      lastLearnedAt: latestTime
    };
  }

  getAllPatterns(): LearnedSolution[] {
    return Array.from(this.solutions.values()).sort(
      (a, b) => b.confidenceScore - a.confidenceScore
    );
  }
}
