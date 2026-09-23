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

export interface AccountQuotaSnapshot {
  accountId: string;
  providerId: string;
  windows: QuotaWindow[];
  recommendation: QuotaRecommendation;
  recommendationReason?: string;
  freshness: QuotaFreshness;
  rawSourceVersion?: string;
  observedAt: string;
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
