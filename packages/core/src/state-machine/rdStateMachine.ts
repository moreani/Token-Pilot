import type { RDProjectState } from '@tokenpilot/contracts';

export class InvalidRDStateTransitionError extends Error {
  constructor(public from: RDProjectState, public to: RDProjectState, reason?: string) {
    super(
      `Illegal R&D Build Engine state transition: cannot move from '${from}' to '${to}'${
        reason ? ` (${reason})` : ''
      }`
    );
    this.name = 'InvalidRDStateTransitionError';
  }
}

// Strict transition rules per RD_Build_Engine_PRD.md Section 64
const RD_ALLOWED_TRANSITIONS: Record<RDProjectState, readonly RDProjectState[]> = {
  DISCOVERED: ['SELECTED', 'CANCELLED'],
  SELECTED: ['RESEARCHING', 'DISCOVERED', 'CANCELLED'],
  RESEARCHING: ['RESEARCHED', 'BLOCKED', 'FAILED', 'CANCELLED'],
  RESEARCHED: ['PLANNED', 'RESEARCHING', 'CANCELLED'],
  PLANNED: ['BOOTSTRAPPING', 'RESEARCHED', 'CANCELLED'],
  BOOTSTRAPPING: ['BUILDING', 'FAILED', 'BLOCKED', 'CANCELLED'],
  BUILDING: ['TESTING', 'FAILED', 'BLOCKED', 'CANCELLED'],
  TESTING: ['REPAIRING', 'VERIFYING', 'FAILED', 'CANCELLED'],
  REPAIRING: ['TESTING', 'NEEDS_HUMAN_REVIEW', 'FAILED', 'CANCELLED'],
  VERIFYING: ['PACKAGING', 'TESTING', 'FAILED', 'CANCELLED'],
  PACKAGING: ['READY', 'FAILED', 'CANCELLED'],
  READY: [],
  // Terminal / Intervention states
  NEEDS_HUMAN_REVIEW: ['REPAIRING', 'PLANNED', 'CANCELLED', 'FAILED'],
  BLOCKED: ['RESEARCHING', 'CANCELLED'],
  FAILED: [],
  CANCELLED: []
};

export function canTransitionRD(from: RDProjectState, to: RDProjectState): boolean {
  const allowed = RD_ALLOWED_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

export function assertTransitionRD(from: RDProjectState, to: RDProjectState, reason?: string): void {
  // PRD Core Rule: Never call a project "working" or "READY" without testing and verification
  if ((from === 'BUILDING' || from === 'BOOTSTRAPPING' || from === 'PLANNED') && to === 'READY') {
    throw new InvalidRDStateTransitionError(
      from,
      to,
      'PRD VIOLATION: Cannot mark project READY without passing multi-layer testing and verification pipeline.'
    );
  }

  // PRD Core Rule: Research first, build second
  if ((from === 'DISCOVERED' || from === 'SELECTED') && (to === 'BUILDING' || to === 'BOOTSTRAPPING')) {
    throw new InvalidRDStateTransitionError(
      from,
      to,
      'PRD VIOLATION: Research and Build Pack planning must be completed before bootstrapping or building.'
    );
  }

  if (!canTransitionRD(from, to)) {
    throw new InvalidRDStateTransitionError(from, to, reason);
  }
}
