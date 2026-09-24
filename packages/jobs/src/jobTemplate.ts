import type {
  JobPermissions,
  JobType,
  ProviderCapabilities,
  RepoLabSpec
} from '@tokenpilot/contracts';

export interface JobPreview {
  title: string;
  summary: string;
  estimatedTokens: number;
  estimatedDurationMs: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface JobPlanStep {
  name: string;
  type: 'discovery' | 'sandbox' | 'agent' | 'verification';
  description: string;
}

export interface JobPlan {
  steps: JobPlanStep[];
}

export interface JobTemplate<TConfig> {
  id: JobType;
  displayName: string;
  describe(config: TConfig): JobPreview;
  validate(config: TConfig): ValidationResult;
  requiredPermissions(config: TConfig): JobPermissions;
  requiredCapabilities(config: TConfig): Array<keyof ProviderCapabilities>;
  buildPlan(config: TConfig): JobPlan;
}
