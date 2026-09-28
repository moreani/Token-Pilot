export type UpdateComponentType = 'engine' | 'skills' | 'providers' | 'security';

export interface ComponentUpdateInfo {
  component: UpdateComponentType;
  displayName: string;
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  releaseNotes: string[];
  urgency: 'low' | 'medium' | 'critical';
  lastCheckedAt: string;
}

export interface UpdateCheckResult {
  checkedAt: string;
  components: ComponentUpdateInfo[];
  totalUpdatesAvailable: number;
  systemStatus: 'up-to-date' | 'updates-available' | 'checking';
}

export interface UpdateApplyResult {
  success: boolean;
  appliedAt: string;
  updatedComponents: UpdateComponentType[];
  log: string[];
  errors?: string[];
}
