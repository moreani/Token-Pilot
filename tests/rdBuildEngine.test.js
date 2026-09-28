import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  assertTransitionRD,
  canTransitionRD,
  InvalidRDStateTransitionError
} from '../packages/core/dist/state-machine/rdStateMachine.js';

import {
  SEED_OPPORTUNITIES,
  getResearchItemsForOpportunity,
  getBuildPackForOpportunity,
  getMockTestResults,
  getMockRepairHistory,
  getMockProjectPackage
} from '../packages/jobs/dist/rdCatalog.js';

test('R&D Build Engine: Full legal lifecycle transitions from DISCOVERED to READY', () => {
  const lifecycle = [
    ['DISCOVERED', 'SELECTED'],
    ['SELECTED', 'RESEARCHING'],
    ['RESEARCHING', 'RESEARCHED'],
    ['RESEARCHED', 'PLANNED'],
    ['PLANNED', 'BOOTSTRAPPING'],
    ['BOOTSTRAPPING', 'BUILDING'],
    ['BUILDING', 'TESTING'],
    ['TESTING', 'REPAIRING'],
    ['REPAIRING', 'TESTING'],
    ['TESTING', 'VERIFYING'],
    ['VERIFYING', 'PACKAGING'],
    ['PACKAGING', 'READY']
  ];

  for (const [from, to] of lifecycle) {
    assert.equal(canTransitionRD(from, to), true, `Should allow transition from ${from} to ${to}`);
    assert.doesNotThrow(() => assertTransitionRD(from, to));
  }
});

test('R&D Build Engine: Enforces PRD Core Rules (Cannot skip research or testing)', () => {
  // Rule 1: Research first, build second (cannot skip from DISCOVERED directly to BUILDING)
  assert.throws(
    () => assertTransitionRD('DISCOVERED', 'BUILDING'),
    InvalidRDStateTransitionError,
    'Cannot jump from DISCOVERED directly to BUILDING'
  );

  // Rule 2: Cannot call project READY without passing testing and verification
  assert.throws(
    () => assertTransitionRD('BUILDING', 'READY'),
    InvalidRDStateTransitionError,
    'Cannot jump from BUILDING directly to READY'
  );

  assert.throws(
    () => assertTransitionRD('PLANNED', 'READY'),
    InvalidRDStateTransitionError,
    'Cannot jump from PLANNED directly to READY'
  );
});

test('R&D Build Engine: Terminal state invariant (READY and FAILED cannot transition further)', () => {
  assert.equal(canTransitionRD('READY', 'DISCOVERED'), false);
  assert.equal(canTransitionRD('READY', 'BUILDING'), false);
  assert.equal(canTransitionRD('FAILED', 'BUILDING'), false);
  assert.equal(canTransitionRD('CANCELLED', 'SELECTED'), false);
});

test('R&D Build Engine: Seed discovery catalog provides rich multi-category opportunities', () => {
  assert.ok(SEED_OPPORTUNITIES.length >= 4, 'Should contain at least 4 seed opportunities');
  
  const categories = new Set(SEED_OPPORTUNITIES.map((o) => o.category));
  assert.ok(categories.has('ai'), 'Should contain AI category');
  assert.ok(categories.has('devtools'), 'Should contain DevTools category');
  assert.ok(categories.has('saas'), 'Should contain SaaS category');
  assert.ok(categories.has('web'), 'Should contain Web category');

  for (const opp of SEED_OPPORTUNITIES) {
    assert.ok(opp.id.startsWith('opp-'));
    assert.ok(opp.title.length > 5);
    assert.ok(opp.dimensions.novelty > 0);
    assert.ok(opp.dimensions.researchConfidence > 0);
    assert.ok(opp.recommendedStack.length > 0);
    assert.ok(opp.availableSkills.length > 0);
  }
});

test('R&D Build Engine: Research pack and Build Pack generation preserve license provenance', () => {
  const sampleOpp = SEED_OPPORTUNITIES[0];
  const research = getResearchItemsForOpportunity(sampleOpp.id);
  
  assert.ok(research.length >= 4, 'Should contain at least 4 research items');
  const repoItem = research.find((r) => r.type === 'repository');
  assert.ok(repoItem, 'Should have repository research item');
  assert.equal(repoItem.licensePermitted, true);
  assert.equal(repoItem.compatibility, 'compatible');

  const buildPack = getBuildPackForOpportunity(sampleOpp);
  assert.ok(buildPack.projectDefinition.name.length > 0);
  assert.ok(buildPack.implementationStrategy.reused.length > 0);
  assert.ok(buildPack.implementationStrategy.added.length > 0);
  assert.ok(buildPack.provenance.length > 0);

  const tests = getMockTestResults();
  assert.ok(tests.some((t) => t.category === 'build' && t.status === 'pass'));
  assert.ok(tests.some((t) => t.category === 'unit' && t.status === 'pass'));
  assert.ok(tests.some((t) => t.category === 'e2e' && t.status === 'pass'));

  const pkg = getMockProjectPackage(sampleOpp);
  assert.ok(pkg.readme.includes('# FrameCheck AI'));
  assert.ok(pkg.runCommand.includes('npm run dev'));
});
