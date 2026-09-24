export interface ProviderCapabilities {
  trackUsage: boolean;
  remainingQuota: boolean;
  resetTime: boolean;
  executeJobs: boolean;
  switchAccount: boolean;
  directApi: boolean;
  cli: boolean;
  supportsPaidOverageDetection: boolean;
}

export interface Provider {
  id: string;
  displayName: string;
  iconKey: string;
  enabled: boolean;
  capabilities: ProviderCapabilities;
}

export type AuthStatus = 'ready' | 'missing' | 'expired' | 'error';

export interface Account {
  id: string;
  providerId: string;
  displayAlias: string;
  upstreamIdentities: string[];
  capabilities: ProviderCapabilities;
  authStatus: AuthStatus;
  lastSeenAt: string | null;
  enabled: boolean;
  photoUrl?: string;
}
