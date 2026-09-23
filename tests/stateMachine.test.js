import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertTransition,
  canTransition,
  InvalidStateTransitionError
} from '../packages/core/dist/state-machine/jobStateMachine.js';

test('State Machine: allows full legal job lifecycle', () => {
  const legalSequence = [
    { from: 'DRAFT', to: 'CONFIGURED' },
    { from: 'CONFIGURED', to: 'READY_FOR_REVIEW' },
    { from: 'READY_FOR_REVIEW', to: 'PREFLIGHT' },
    { from: 'PREFLIGHT', to: 'AWAITING_CONFIRMATION' },
    { from: 'AWAITING_CONFIRMATION', to: 'AUTHORIZED' },
    { from: 'AUTHORIZED', to: 'PREPARING_SANDBOX' },
    { from: 'PREPARING_SANDBOX', to: 'SANDBOX_READY' },
    { from: 'SANDBOX_READY', to: 'STARTING_AGENT' },
    { from: 'STARTING_AGENT', to: 'RUNNING' },
    { from: 'RUNNING', to: 'COMPLETED' }
  ];

  for (const step of legalSequence) {
    assert.equal(
      canTransition(step.from, step.to),
      true,
      `Expected transition ${step.from} -> ${step.to} to be valid`
    );
    assert.doesNotThrow(() => assertTransition(step.from, step.to));
  }
});

test('State Machine: supports pause and resume lifecycle', () => {
  assert.equal(canTransition('RUNNING', 'PAUSING'), true);
  assert.equal(canTransition('PAUSING', 'PAUSED'), true);
  assert.equal(canTransition('PAUSED', 'RUNNING'), true);
});

test('State Machine: CRITICAL INVARIANT - AWAITING_CONFIRMATION cannot transition directly to RUNNING', () => {
  assert.equal(canTransition('AWAITING_CONFIRMATION', 'RUNNING'), false);
  assert.throws(
    () => assertTransition('AWAITING_CONFIRMATION', 'RUNNING'),
    (err) => {
      return (
        err instanceof InvalidStateTransitionError &&
        err.message.includes('CRITICAL: Execution boundary violated')
      );
    }
  );
});

test('State Machine: CRITICAL INVARIANT - AUTHORIZED cannot jump to RUNNING without sandbox preparation', () => {
  assert.equal(canTransition('AUTHORIZED', 'RUNNING'), false);
  assert.throws(
    () => assertTransition('AUTHORIZED', 'RUNNING'),
    (err) => {
      return (
        err instanceof InvalidStateTransitionError &&
        err.message.includes('Sandbox must be prepared and ready')
      );
    }
  );
});

test('State Machine: rejects transitions from terminal states', () => {
  assert.equal(canTransition('COMPLETED', 'RUNNING'), false);
  assert.throws(() => assertTransition('COMPLETED', 'RUNNING'));

  assert.equal(canTransition('FAILED', 'RUNNING'), false);
  assert.throws(() => assertTransition('FAILED', 'RUNNING'));

  assert.equal(canTransition('SECURITY_BLOCKED', 'RUNNING'), false);
  assert.throws(() => assertTransition('SECURITY_BLOCKED', 'RUNNING'));
});
