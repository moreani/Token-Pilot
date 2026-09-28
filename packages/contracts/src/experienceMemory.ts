export type ErrorCategory =
  | 'ENVIRONMENT'
  | 'BUILD'
  | 'RUNTIME'
  | 'LOGIC'
  | 'TEST'
  | 'EXTERNAL'
  | 'SECURITY';

export interface ErrorFingerprint {
  signatureHash: string;
  category: ErrorCategory;
  patternRegex: string;
  description: string;
  framework?: string;
}

export interface LearnedSolution {
  id: string;
  fingerprint: ErrorFingerprint;
  patchTemplate: string;
  sampleErrorSnippet: string;
  explanation: string;
  successCount: number;
  failureCount: number;
  tokensSavedTotal: number;
  confidenceScore: number; // 0.0 to 1.0
  createdAt: string;
  lastAppliedAt?: string;
}

export interface RepairCycleRecord {
  cycleIndex: number;
  failureSummary: string;
  category: ErrorCategory;
  hypothesis: string;
  patchApplied: string;
  testPassed: boolean;
  tokensBurned: number;
  learnedPatternId?: string;
  resolvedViaMemory: boolean;
  timestamp: string;
}

export interface ExperienceMemoryStats {
  totalPatternsLearned: number;
  totalRepairsExecuted: number;
  totalTokensSavedViaMemory: number;
  averageConfidenceScore: number;
  lastLearnedAt?: string;
}
