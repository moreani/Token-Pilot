export interface QuotaWindow {
  id: string;
  label: string;
  usedFraction: number | null;
  remainingFraction: number | null;
  resetsAt: string | null;
  observedAt: string;
  source: string;
}

export type QuotaRecommendation =
  | 'burn'
  | 'on_pace'
  | 'conserve'
  | 'empty'
  | 'unknown'
  | 'error';

export type QuotaFreshness = 'fresh' | 'stale' | 'too_stale';

export interface ModelQuotaDetail {
  id: string;
  displayName: string;
  family: 'gemini' | 'claude_gpt' | 'other';
  remainingFraction: number;
  percentage: number;
  resetTime?: string;
  speedTag?: string; // e.g. "Fast", "Medium", "Low", "Thinking"
  supportsThinking?: boolean;
}

export interface ModelGroupQuota {
  groupName: string; // e.g. "Gemini Models", "Claude and GPT models"
  weeklyLimitRemaining: number; // percentage 0-100
  weeklyResetTime?: string; // formatted countdown or time string
  fiveHourLimitRemaining: number; // percentage 0-100
  fiveHourResetTime?: string; // formatted countdown or time string
}

export interface AccountQuotaSnapshot {
  accountId: string;
  providerId: string;
  windows: QuotaWindow[];
  recommendation: QuotaRecommendation;
  recommendationReason?: string;
  freshness: QuotaFreshness;
  rawSourceVersion?: string;
  observedAt: string;
  modelGroups?: ModelGroupQuota[];
  modelDetails?: ModelQuotaDetail[];
}

export interface QuotaSuggestion {
  recommendedAccountId: string;
  providerId: string;
  accountAlias: string;
  recommendation: QuotaRecommendation;
  remainingFraction: number;
  resetsInHours: number;
  reason: string;
  suggestedJobType: string;
}
