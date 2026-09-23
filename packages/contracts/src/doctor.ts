export type DoctorStatus = 'ok' | 'warning' | 'error' | 'not_configured';

export interface DoctorCheck {
  id: string;
  category: 'quota' | 'execution' | 'browser' | 'system';
  name: string;
  status: DoctorStatus;
  message: string;
  details?: string;
  critical: boolean;
}

export interface SystemDoctorReport {
  timestamp: string;
  allOk: boolean;
  checks: DoctorCheck[];
}
