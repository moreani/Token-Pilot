export interface QuotaWindow {
  id: string;
  label: string;
  usedFraction: number | null;
  remainingFraction: number | null;
  resetsAt: string | null;
  resetLabel?: string | null;
  remainingLabel?: string | null;
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
  speedTag?: string; // e.g. "Fast", "Medium", "Low", "Thinking", "Flash", "Free / Unlimited"
  supportsThinking?: boolean;
  tier?: string; // e.g. "26,000 / $60", "∞ unlimited free"
  isUnlimited?: boolean;
  isNew?: boolean;
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

export const OPENCODE_MODELS: ModelQuotaDetail[] = [
  {
    id: 'deepseek-v4-1-flash',
    displayName: 'DeepSeek V4.1 Flash',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Flash',
    tier: '26,000 / $60',
    isNew: true,
    resetTime: 'Monthly'
  },
  {
    id: 'mimo-v2-6-flash',
    displayName: 'MiMo-V2.6-Flash',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Flash',
    tier: '30,100 / $60',
    isNew: true,
    resetTime: 'Monthly'
  },
  {
    id: 'muse-spark-1-3',
    displayName: 'Muse Spark 1.3 Contributor',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Contributor',
    tier: '45,300 / $60',
    isNew: false,
    resetTime: 'Monthly'
  },
  {
    id: 'space-bunny-free',
    displayName: 'Space Bunny Free',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Free / Unlimited',
    tier: '∞ unlimited free',
    isUnlimited: true,
    isNew: true,
    resetTime: 'Unlimited'
  },
  {
    id: 'longcat-2-5-preview-free',
    displayName: 'LongCat 2.5 Preview Free',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Free / Unlimited',
    tier: '∞ unlimited free',
    isUnlimited: true,
    isNew: true,
    resetTime: 'Unlimited'
  },
  {
    id: 'glm-4-5-flash',
    displayName: 'GLM-4.5-Flash',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Flash',
    tier: 'High speed',
    isNew: true,
    resetTime: 'Monthly'
  }
];

export const OPENCODE_ESCALATION_MODELS: ModelQuotaDetail[] = [
  {
    id: 'deepseek-v4-pro',
    displayName: 'DeepSeek V4 Pro',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Pro',
    tier: '1,050 / $60',
    isNew: false,
    resetTime: 'Monthly'
  },
  {
    id: 'gpt-6-luna',
    displayName: 'GPT 6 Luna',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Frontier',
    tier: '4,230 / $15',
    isNew: true,
    resetTime: 'Monthly'
  },
  {
    id: 'grok-4-7',
    displayName: 'Grok 4.7',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Frontier',
    tier: '169 / $15',
    isNew: true,
    resetTime: 'Monthly'
  },
  {
    id: 'kimi-k2-7-code',
    displayName: 'Kimi K2.7 Code',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Code Specialist',
    tier: '1,350 / $60',
    isNew: false,
    resetTime: 'Monthly'
  },
  {
    id: 'kimi-k3',
    displayName: 'Kimi K3',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Deep Reasoning',
    tier: '110 / $15',
    isNew: false,
    resetTime: 'Monthly'
  },
  {
    id: 'qwen3-8-max',
    displayName: 'Qwen3.8 Max',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Max Reasoning',
    tier: '160 / $15',
    isNew: false,
    resetTime: 'Monthly'
  },
  {
    id: 'minimax-m3',
    displayName: 'MiniMax M3',
    family: 'other',
    remainingFraction: 1.0,
    percentage: 100,
    speedTag: 'Tool Specialist',
    tier: '3,200 / $60',
    isNew: false,
    resetTime: 'Monthly'
  }
];

export interface OpenCodeEscalationPolicy {
  primaryModelId: string;
  escalationModelId: string;
  triggerReason: string;
  activatedAt?: string;
}


