import type { JobState } from '@tokenpilot/contracts';

export class InvalidStateTransitionError extends Error {
  constructor(public from: JobState, public to: JobState, reason?: string) {
    super(
      `Illegal job state transition: cannot move from '${from}' to '${to}'${
        reason ? ` (${reason})` : ''
      }`
    );
    this.name = 'InvalidStateTransitionError';
  }
}

// Strict mapping of allowed transitions
const ALLOWED_TRANSITIONS: Record<JobState, readonly JobState[]> = {
  DRAFT: ['CONFIGURED', 'CANCELLED'],
  CONFIGURED: ['READY_FOR_REVIEW', 'DRAFT', 'CANCELLED'],
  READY_FOR_REVIEW: ['PREFLIGHT', 'CONFIGURED', 'CANCELLED'],
  PREFLIGHT: ['AWAITING_CONFIRMATION', 'CONFIGURED', 'FAILED', 'CANCELLED'],
  AWAITING_CONFIRMATION: ['AUTHORIZED', 'CONFIGURED', 'CANCELLED'],
  // Must go to PREPARING_SANDBOX; cannot jump directly to RUNNING
  AUTHORIZED: ['PREPARING_SANDBOX', 'AWAITING_CONFIRMATION', 'CANCELLED'],
  PREPARING_SANDBOX: ['SANDBOX_READY', 'FAILED', 'SECURITY_BLOCKED', 'CANCELLED'],
  SANDBOX_READY: ['STARTING_AGENT', 'FAILED', 'SECURITY_BLOCKED', 'CANCELLED'],
  STARTING_AGENT: ['RUNNING', 'FAILED', 'SECURITY_BLOCKED', 'CANCELLED'],
  RUNNING: ['PAUSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'SECURITY_BLOCKED'],
  PAUSING: ['PAUSED', 'FAILED', 'CANCELLED'],
  PAUSED: ['RUNNING', 'CANCELLED'],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
  SECURITY_BLOCKED: []
};

export function canTransition(from: JobState, to: JobState): boolean {
  const allowed = ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function assertTransition(from: JobState, to: JobState, reason?: string): void {
  // Explicitly check and reject dangerous bypasses mentioned in PRD
  if (from === 'AWAITING_CONFIRMATION' && to === 'RUNNING') {
    throw new InvalidStateTransitionError(
      from,
      to,
      'CRITICAL: Execution boundary violated! Awaiting confirmation cannot transition directly to running.'
    );
  }

  if (from === 'AUTHORIZED' && to === 'RUNNING') {
    throw new InvalidStateTransitionError(
      from,
      to,
      'CRITICAL: Sandbox must be prepared and ready before starting execution.'
    );
  }

  if (!canTransition(from, to)) {
    throw new InvalidStateTransitionError(from, to, reason);
  }
}
