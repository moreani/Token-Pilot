/**
 * R&D Build Engine Contracts
 * Specification derived from RD_Build_Engine_PRD.md
 */

export type RDProjectState =
  | 'DISCOVERED'
  | 'SELECTED'
  | 'RESEARCHING'
  | 'RESEARCHED'
  | 'PLANNED'
  | 'BOOTSTRAPPING'
  | 'BUILDING'
  | 'TESTING'
  | 'REPAIRING'
  | 'VERIFYING'
  | 'PACKAGING'
  | 'READY'
  // Terminal failure / intervention states
  | 'BLOCKED'
  | 'FAILED'
  | 'NEEDS_HUMAN_REVIEW'
  | 'CANCELLED';

export type RDExecutionMode = 'explore' | 'experiment' | 'build';

export type OpportunityCategory =
  | 'ai'
  | 'web'
  | 'saas'
  | 'devtools'
  | 'design'
  | 'random_rd';

export type OpportunityComplexity = 'low' | 'medium' | 'high';

export interface OpportunityDimensions {
  novelty: number;                  // 0-100
  resourceAvailability: number;     // 0-100
  implementationDifficulty: number; // 0-100
  learningValue: number;            // 0-100
  portfolioRelevance: number;       // 0-100
  reusePotential: number;           // 0-100
  testingFeasibility: number;       // 0-100
  timeToWorkingBuild: string;       // e.g. "2 hours", "1 day"
  researchConfidence: number;       // 0-100
}

export interface OpportunityRecord {
  id: string;
  title: string;
  category: OpportunityCategory;
  summary: string;
  problem: string;
  whyNow: string;
  potentialUsers: string[];
  existingProducts: string[];
  openSourceOptions: Array<{
    name: string;
    url: string;
    stars?: number;
    license: string;
  }>;
  availableSkills: Array<{
    name: string;
    source: string;
    description: string;
  }>;
  designReferences: Array<{
    title: string;
    url?: string;
    type: string;
    notes: string;
  }>;
  recommendedStack: string[];
  complexity: OpportunityComplexity;
  estimatedDuration: string;
  learningValue: string;
  portfolioRelevance: string;
  researchConfidence: string;
  knownRisks: string[];
  suggestedMode: RDExecutionMode;
  dimensions: OpportunityDimensions;
}

export type ResearchItemType =
  | 'repository'
  | 'skill'
  | 'framework'
  | 'design'
  | 'tool'
  | 'documentation';

export type ResearchDecision = 'use' | 'reference' | 'ignore' | 'blocked';

export type CompatibilityStatus = 'compatible' | 'needs_changes' | 'incompatible';

export interface ResearchItem {
  id: string;
  type: ResearchItemType;
  title: string;
  source: string;
  license: string;
  licensePermitted: boolean;
  relevance: number;                // 0-100
  qualitySignals: string[];
  compatibility: CompatibilityStatus;
  decision: ResearchDecision;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface BuildPack {
  projectDefinition: {
    name: string;
    goal: string;
    targetUsers: string[];
    mainWorkflow: string;
    successCriteria: string[];
  };
  architecture: {
    frontend: string;
    backend: string;
    database: string;
    aiLayer: string;
    storage?: string;
    authentication?: string;
  };
  resourceSelection: {
    baseRepository?: string;
    selectedSkills: string[];
    selectedLibraries: string[];
    selectedFrameworks: string[];
    designReferences: string[];
  };
  implementationStrategy: {
    reused: string[];
    rewritten: string[];
    added: string[];
    removed: string[];
    redesigned: string[];
  };
  testStrategy: {
    unitTests: string[];
    integrationTests: string[];
    e2eFlows: string[];
    visualQA: string[];
    securityChecks: string[];
    performanceChecks: string[];
  };
  provenance: Array<{
    resourceName: string;
    source: string;
    commit?: string;
    license: string;
    usage: 'reference' | 'modified' | 'included';
    attributionRequired: boolean;
  }>;
  checkpoints: string[];
}

export type TestCategory =
  | 'build'
  | 'static'
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'visual'
  | 'accessibility'
  | 'security'
  | 'performance'
  | 'ai';

export type TestStatus = 'pass' | 'fail' | 'skip';

export interface TestResultModel {
  testId: string;
  category: TestCategory;
  title: string;
  command: string;
  status: TestStatus;
  durationMs: number;
  evidence: string[];
  errors: string[];
  artifactPaths: string[];
}

export interface RepairAttempt {
  attemptNumber: number;
  failure: string;
  evidence: string;
  hypothesis: string;
  change: string;
  testCommand: string;
  result: 'resolved' | 'unresolved';
}

export interface ProjectPackage {
  readme: string;
  architectureDoc: string;
  testingDoc: string;
  securityDoc: string;
  sourcesDoc: string;
  licensesDoc: string;
  sourceManifest: Record<string, unknown>;
  screenshots: string[];
  workingDir: string;
  runCommand: string;
}

export interface RDProject {
  id: string;
  opportunity: OpportunityRecord;
  mode: RDExecutionMode;
  state: RDProjectState;
  researchItems: ResearchItem[];
  buildPack?: BuildPack;
  testResults: TestResultModel[];
  repairHistory: RepairAttempt[];
  package?: ProjectPackage;
  workspacePath: string;
  fundingAccountId?: string;
  fundingProviderId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
