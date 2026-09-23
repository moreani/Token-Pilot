import type { AccountQuotaSnapshot, QuotaSuggestion } from '@tokenpilot/contracts';

export interface QuotaDoctorResult {
  source: 'aiuse' | 'mock';
  available: boolean;
  version?: string;
  details: string;
}

export interface QuotaSource {
  doctor(): Promise<QuotaDoctorResult>;
  snapshot(): Promise<AccountQuotaSnapshot[]>;
  suggestion(): Promise<QuotaSuggestion | null>;
}
