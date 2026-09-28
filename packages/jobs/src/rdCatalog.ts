import type {
  OpportunityRecord,
  ResearchItem,
  BuildPack,
  TestResultModel,
  RepairAttempt,
  ProjectPackage,
  RDProject
} from '@tokenpilot/contracts';

export const SEED_OPPORTUNITIES: OpportunityRecord[] = [
  {
    id: 'opp-framecheck-ai',
    title: 'FrameCheck AI — Screenshot to Responsive Frontend Generator',
    category: 'ai',
    summary: 'Turn UI screenshots or Figma exports into clean, responsive, accessible React components with automated Playwright validation.',
    problem: 'Developers waste hours manually slicing screenshots and recreating CSS layouts from scratch without automated visual verification.',
    whyNow: 'Multimodal vision models (Gemini 2.5 / 3.0) can now parse exact pixel coordinates, typography, and responsive breakpoints directly.',
    potentialUsers: ['Frontend Developers', 'Design Engineers', 'Product Founders', 'Rapid Prototypers'],
    existingProducts: ['v0.dev', 'Screenshot to Code', 'Bolt.new'],
    openSourceOptions: [
      { name: 'abi/screenshot-to-code', url: 'https://github.com/abi/screenshot-to-code', stars: 62000, license: 'Apache-2.0' },
      { name: 'shadcn/ui', url: 'https://github.com/shadcn-ui/ui', stars: 74000, license: 'MIT' }
    ],
    availableSkills: [
      { name: 'frontend-ui', source: '.agents/skills/frontend-ui', description: 'Tailwind and React design system assembler' },
      { name: 'app-media-recorder', source: '.agents/skills/app-media-recorder', description: 'Pixel-perfect desktop and mobile screenshot capture' },
      { name: 'generative_ui', source: 'builtin/skills/generative_ui', description: 'Rich interactive widgets and standalone artifact renderer' }
    ],
    designReferences: [
      { title: 'Linear-style dark dashboard', type: 'dashboard', notes: 'Sleek dark theme with subtle cyan border highlights' },
      { title: 'Interactive side-by-side image comparison slider', type: 'component', notes: 'Before/after overlay slider' }
    ],
    recommendedStack: ['Next.js / React 19', 'Tailwind CSS', 'Playwright', 'Lucide React', 'SQLite'],
    complexity: 'medium',
    estimatedDuration: '45 mins (Build Mode)',
    learningValue: 'Multimodal Vision Parsing & Playwright Visual Regression',
    portfolioRelevance: 'High — Showcase real AI code generation with automated E2E testing',
    researchConfidence: '96%',
    knownRisks: ['Complex canvas elements may need manual SVG conversion', 'Token limit on massive screenshot payloads'],
    suggestedMode: 'build',
    dimensions: {
      novelty: 88,
      resourceAvailability: 94,
      implementationDifficulty: 48,
      learningValue: 92,
      portfolioRelevance: 95,
      reusePotential: 90,
      testingFeasibility: 96,
      timeToWorkingBuild: '45 minutes',
      researchConfidence: 96
    }
  },
  {
    id: 'opp-graphify-dossier',
    title: 'Graphify Architecture Scout — AST God Node & Relationship Extractor',
    category: 'devtools',
    summary: 'Autonomous code analyzer that parses repository ASTs to discover circular dependencies, God Nodes, and modular blast radiuses.',
    problem: 'Large repositories are notoriously opaque; engineers lack instant visual knowledge graphs showing which modules are risky to modify.',
    whyNow: 'Tree-sitter and AST-based semantic graph extraction provide 100x faster insights than raw grep without expensive LLM API costs.',
    potentialUsers: ['Tech Leads', 'Open Source Maintainers', 'Security Auditors', 'Refactoring Engineers'],
    existingProducts: ['CodeScene', 'Sourcetrail', 'Dependency-Cruiser'],
    openSourceOptions: [
      { name: 'moreani/Token-Pilot (graphify engine)', url: 'https://github.com/moreani/Token-Pilot', license: 'MIT' },
      { name: 'tree-sitter/tree-sitter', url: 'https://github.com/tree-sitter/tree-sitter', stars: 22000, license: 'MIT' }
    ],
    availableSkills: [
      { name: 'graphify', source: '.agents/skills/graphify', description: 'Persistent knowledge graph with God node and shortest path search' },
      { name: 'ast-audit', source: '.agents/skills/ast-audit', description: 'Fast syntax-tree analyzer and circular dependency spotter' }
    ],
    designReferences: [
      { title: 'Force-directed graph visualizer', type: 'interaction', notes: 'Interactive Canvas/SVG network graph with zoom/pan' }
    ],
    recommendedStack: ['TypeScript', 'Node.js', 'Mermaid.js', 'SQLite', 'Vitest'],
    complexity: 'medium',
    estimatedDuration: '30 mins (Experiment Mode)',
    learningValue: 'AST parsing, graph algorithms, and architectural telemetry',
    portfolioRelevance: 'Very High — Proves deep systems understanding and compiler fundamentals',
    researchConfidence: '98%',
    knownRisks: ['Extremely large repositories (>100k files) require incremental chunking'],
    suggestedMode: 'build',
    dimensions: {
      novelty: 85,
      resourceAvailability: 98,
      implementationDifficulty: 52,
      learningValue: 95,
      portfolioRelevance: 96,
      reusePotential: 94,
      testingFeasibility: 98,
      timeToWorkingBuild: '30 minutes',
      researchConfidence: 98
    }
  },
  {
    id: 'opp-quota-ranger',
    title: 'Adaptive Quota Ranger — Multi-Provider Burn Optimization Engine',
    category: 'saas',
    summary: 'Smart subscription orchestrator that calculates burn pacing, warns of expiring AI credits, and triggers background R&D workloads.',
    problem: 'Developers pay for monthly AI subscriptions ($20-$200/mo) but forfeit up to 60% of unused quota because reset cycles expire unnoticed.',
    whyNow: 'Multi-model workflows with Antigravity, OpenCode, Claude, and Codex require intelligent routing rather than manual tab toggling.',
    potentialUsers: ['AI Engineers', 'Software Agencies', 'Solo Developers', 'R&D Labs'],
    existingProducts: ['TokenPilot Command Center', 'Portkey', 'OpenPipe'],
    openSourceOptions: [
      { name: 'moreani/Token-Pilot', url: 'https://github.com/moreani/Token-Pilot', license: 'MIT' }
    ],
    availableSkills: [
      { name: 'quota-collector', source: 'packages/quota', description: 'Live sqlite & local token cache extractor' },
      { name: 'generative_ui', source: 'builtin/skills/generative_ui', description: 'Visual telemetry gauge cards' }
    ],
    designReferences: [
      { title: 'Financial pacing dials', type: 'dashboard', notes: 'Adaptive progress color tiers: Optimal, Healthy, Moderate, Low, Critical' }
    ],
    recommendedStack: ['React 19', 'Tailwind', 'SQLite WAL', 'Vitest'],
    complexity: 'low',
    estimatedDuration: '20 mins (Experiment Mode)',
    learningValue: 'Telemetry stream processing, rate-limit mathematics, and reactive UI',
    portfolioRelevance: 'High — Practical utility with real cost-saving metrics',
    researchConfidence: '99%',
    knownRisks: ['Provider quota schemas change periodically'],
    suggestedMode: 'build',
    dimensions: {
      novelty: 92,
      resourceAvailability: 95,
      implementationDifficulty: 35,
      learningValue: 88,
      portfolioRelevance: 90,
      reusePotential: 96,
      testingFeasibility: 99,
      timeToWorkingBuild: '20 minutes',
      researchConfidence: 99
    }
  },
  {
    id: 'opp-playwright-synth',
    title: 'Playwright Synth — Zero-Config Web App Journey Tester & Video Recorder',
    category: 'web',
    summary: 'Spawns headless browsers to systematically crawl a web application, capture pixel-perfect screenshots, record 1:1 WebM demo videos, and verify keyboard accessibility.',
    problem: 'Manual QA is tedious; developers often skip browser testing due to brittle selectors and difficult video recorder setup.',
    whyNow: 'Playwright automation with strict locator assertions enables deterministic automated test runs inside sandboxes.',
    potentialUsers: ['QA Engineers', 'Fullstack Developers', 'Product Managers'],
    existingProducts: ['Cypress', 'Playwright Test', 'Checkly'],
    openSourceOptions: [
      { name: 'microsoft/playwright', url: 'https://github.com/microsoft/playwright', stars: 71000, license: 'Apache-2.0' }
    ],
    availableSkills: [
      { name: 'app-media-recorder', source: '.agents/skills/app-media-recorder', description: 'Zero-margin 1:1 video walkthrough and snapshot grabber' }
    ],
    designReferences: [
      { title: 'Video and snapshot carousel view', type: 'component', notes: 'Multi-breakpoint responsive review gallery' }
    ],
    recommendedStack: ['Playwright', 'Node.js', 'FFmpeg', 'Vitest'],
    complexity: 'medium',
    estimatedDuration: '35 mins (Build Mode)',
    learningValue: 'Modern E2E testing paradigms, accessibility audits, and headless browser orchestration',
    portfolioRelevance: 'High — Demonstrates reliable automated quality engineering',
    researchConfidence: '95%',
    knownRisks: ['Requires system Chromium/Chrome binary installed on host'],
    suggestedMode: 'build',
    dimensions: {
      novelty: 80,
      resourceAvailability: 96,
      implementationDifficulty: 45,
      learningValue: 90,
      portfolioRelevance: 92,
      reusePotential: 92,
      testingFeasibility: 97,
      timeToWorkingBuild: '35 minutes',
      researchConfidence: 95
    }
  }
];

export function getResearchItemsForOpportunity(oppId: string): ResearchItem[] {
  return [
    {
      id: `${oppId}-repo-1`,
      type: 'repository',
      title: 'Official Open-Source Reference Repository',
      source: 'https://github.com/abi/screenshot-to-code',
      license: 'Apache-2.0',
      licensePermitted: true,
      relevance: 94,
      qualitySignals: ['62,000+ GitHub Stars', 'Active Commits', 'Comprehensive CI'],
      compatibility: 'compatible',
      decision: 'reference',
      reason: 'Use architecture and prompt layout as clean reference; write custom implementation in TypeScript.',
      metadata: { stars: 62000, language: 'Python/TypeScript' }
    },
    {
      id: `${oppId}-skill-1`,
      type: 'skill',
      title: 'app-media-recorder (SKILL.md)',
      source: '.agents/skills/app-media-recorder/SKILL.md',
      license: 'MIT',
      licensePermitted: true,
      relevance: 98,
      qualitySignals: ['Portable SKILL.md format', 'Headless Chrome integrated', 'Production-ready'],
      compatibility: 'compatible',
      decision: 'use',
      reason: 'Directly bundle into workspace for automated E2E screenshot and WebM recording.',
      metadata: { author: 'TokenPilot Team' }
    },
    {
      id: `${oppId}-skill-2`,
      type: 'skill',
      title: 'generative_ui (SKILL.md)',
      source: 'builtin/skills/generative_ui/SKILL.md',
      license: 'MIT',
      licensePermitted: true,
      relevance: 91,
      qualitySignals: ['Built-in Antigravity skill', 'Interactive widget renderer'],
      compatibility: 'compatible',
      decision: 'use',
      reason: 'Use for rendering real-time validation widgets and carousel previews.',
      metadata: { author: 'DeepMind / Antigravity' }
    },
    {
      id: `${oppId}-design-1`,
      type: 'design',
      title: 'Linear & Raycast Modern Studio UI Reference',
      source: 'Internal Design System',
      license: 'Permissive',
      licensePermitted: true,
      relevance: 95,
      qualitySignals: ['High-contrast dark mode', 'Accessible typography', 'Responsive grid'],
      compatibility: 'compatible',
      decision: 'use',
      reason: 'Provides cohesive visual identity, glassmorphism, and clear status badges.',
      metadata: { theme: 'slate-900 / cyan / emerald' }
    },
    {
      id: `${oppId}-framework-1`,
      type: 'framework',
      title: 'React 19 & Tailwind CSS v4',
      source: 'https://react.dev / https://tailwindcss.com',
      license: 'MIT',
      licensePermitted: true,
      relevance: 99,
      qualitySignals: ['Official standard', 'Zero breaking deprecations'],
      compatibility: 'compatible',
      decision: 'use',
      reason: 'Fastest compile times, modular component separation, and zero-runtime CSS overhead.',
      metadata: { version: '19.0.0' }
    }
  ];
}

export function getBuildPackForOpportunity(opp: OpportunityRecord): BuildPack {
  return {
    projectDefinition: {
      name: opp.title.split('—')[0].trim(),
      goal: opp.summary,
      targetUsers: opp.potentialUsers,
      mainWorkflow: 'Input prompt/asset → Multi-source Research → Build in Sandbox → Multi-layer Testing & Auto-Repair → Verified Output Package',
      successCriteria: [
        '100% Build & TypeScript compilation with 0 errors',
        'Passing Unit & Integration test suites',
        'End-to-end Playwright user journey with captured screenshot verification',
        'Complete documentation (README, ARCHITECTURE, TESTING, SECURITY, SOURCES, LICENSES)',
        'Zero critical security or credential vulnerabilities'
      ]
    },
    architecture: {
      frontend: 'React 19 + Tailwind CSS + Lucide Icons',
      backend: 'Node.js LTS + TypeScript Strict Mode',
      database: 'SQLite (WAL Mode) with parameterized queries',
      aiLayer: 'Google Antigravity Priority #1, OpenCode Priority #2 (Claude/Codex Manual Only)',
      storage: 'Isolated workspace artifact directory',
      authentication: 'Local-first zero-trust session'
    },
    resourceSelection: {
      baseRepository: opp.openSourceOptions[0]?.name || 'none (clean build)',
      selectedSkills: opp.availableSkills.map((s) => s.name),
      selectedLibraries: opp.recommendedStack,
      selectedFrameworks: ['React', 'Tailwind', 'Vitest', 'Playwright'],
      designReferences: opp.designReferences.map((d) => d.title)
    },
    implementationStrategy: {
      reused: ['SKILL.md agent patterns', 'Tailwind utility tokens', 'Playwright test runner harness'],
      rewritten: ['Custom state machine orchestration', 'Isolated execution sandbox boundary'],
      added: ['Automated diagnose → patch → retest auto-fix loop', 'Provenance & license disclosure generator'],
      removed: ['Unused bloat dependencies', 'External telemetry trackers'],
      redesigned: ['Modern unified control surface with dark-mode aesthetic']
    },
    testStrategy: {
      unitTests: ['State machine transition validation', 'Input parsing and sanitization', 'Hash integrity check'],
      integrationTests: ['Workspace filesystem isolation', 'Artifact export pipeline', 'Failover priority logic'],
      e2eFlows: ['Discover → Select → Research → Build → Test → Ready complete user journey'],
      visualQA: ['Desktop (1440x900)', 'Tablet (768x1024)', 'Mobile (375x812) responsive checks'],
      securityChecks: ['No hardcoded secrets', 'Path traversal protection', 'Network isolation policy check'],
      performanceChecks: ['Sub-second build times', 'Bundle payload size < 500KB']
    },
    provenance: [
      {
        resourceName: opp.openSourceOptions[0]?.name || 'open-source-foundation',
        source: opp.openSourceOptions[0]?.url || 'https://github.com',
        license: opp.openSourceOptions[0]?.license || 'MIT',
        usage: 'reference',
        attributionRequired: true
      },
      {
        resourceName: 'app-media-recorder',
        source: '.agents/skills/app-media-recorder',
        license: 'MIT',
        usage: 'included',
        attributionRequired: true
      }
    ],
    checkpoints: [
      'checkpoint-001-bootstrap',
      'checkpoint-002-research-pack',
      'checkpoint-003-core-implementation',
      'checkpoint-004-test-pipeline',
      'checkpoint-005-verification-ready'
    ]
  };
}

export function getMockTestResults(): TestResultModel[] {
  return [
    {
      testId: 'test-build',
      category: 'build',
      title: 'Build & TypeScript Compilation',
      command: 'npm run build',
      status: 'pass',
      durationMs: 780,
      evidence: ['tsc compiled cleanly with 0 errors', 'vite build generated production bundle (409 KB)'],
      errors: [],
      artifactPaths: ['dist/index.html', 'dist/assets/index.js']
    },
    {
      testId: 'test-static',
      category: 'static',
      title: 'Static Analysis & Lint Check',
      command: 'npm run lint',
      status: 'pass',
      durationMs: 340,
      evidence: ['No unused imports detected', 'Zero syntax or circular dependency warnings'],
      errors: [],
      artifactPaths: []
    },
    {
      testId: 'test-unit',
      category: 'unit',
      title: 'Unit Test Suite (26/26 passing)',
      command: 'npm test',
      status: 'pass',
      durationMs: 2280,
      evidence: ['26 tests passed, 0 failed', 'State machine transitions verified', 'Failover priority validated'],
      errors: [],
      artifactPaths: ['tests/failover.test.js', 'tests/rdBuildEngine.test.js']
    },
    {
      testId: 'test-e2e',
      category: 'e2e',
      title: 'Playwright E2E User Journey',
      command: 'npx playwright test',
      status: 'pass',
      durationMs: 3420,
      evidence: ['User journey verified from Step 1 through Step 6', 'Headless Chromium session succeeded with 0 console errors'],
      errors: [],
      artifactPaths: ['test-results/journey.webm']
    },
    {
      testId: 'test-visual',
      category: 'visual',
      title: 'Visual QA & Responsive Snapshots',
      command: 'node scripts/visual-qa.cjs',
      status: 'pass',
      durationMs: 1250,
      evidence: ['Zero horizontal scroll overflow on mobile (375px)', 'Desktop layout rendered cleanly (1440px)'],
      errors: [],
      artifactPaths: ['screenshots/desktop.png', 'screenshots/mobile.png']
    },
    {
      testId: 'test-security',
      category: 'security',
      title: 'Security & Zero-Trust Audit',
      command: 'node scripts/security-audit.cjs',
      status: 'pass',
      durationMs: 410,
      evidence: ['Zero hardcoded API keys found', 'Sandbox host directory traversal blocked', 'Zero CVEs detected'],
      errors: [],
      artifactPaths: ['reports/security-audit.json']
    }
  ];
}

export function getMockRepairHistory(): RepairAttempt[] {
  return [
    {
      attemptNumber: 1,
      failure: 'Playwright E2E: Selector timeout waiting for auth button on step 6',
      evidence: 'Timed out 3000ms waiting for [data-testid="auth-btn"] due to async state hydration delay',
      hypothesis: 'Add explicit wait for client state hydration prior to querying DOM selector',
      change: 'Added page.waitForSelector("[data-testid=auth-btn]", { state: "visible" })',
      testCommand: 'npx playwright test e2e/wizard.spec.ts',
      result: 'resolved'
    }
  ];
}

export function getMockProjectPackage(opp: OpportunityRecord): ProjectPackage {
  const name = opp.title.split('—')[0].trim();
  return {
    readme: `# ${name}\n\n${opp.summary}\n\n## Quick Start\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Features\n- Tested with automated Playwright visual suite\n- Built on ${opp.recommendedStack.join(', ')}\n- Verified by TokenPilot R&D Build Engine`,
    architectureDoc: `# Architecture: ${name}\n\nLocal-first modular architecture with clean separation of UI, orchestration, and sandbox execution.`,
    testingDoc: `# Testing Suite\n\n- Build: TypeScript strict compiler\n- Unit tests: 26 passed\n- E2E: Playwright Chromium user flows\n- Security: Zero-trust scan`,
    securityDoc: `# Security Audit Report\n\n- Secrets: 0 detected\n- Isolation: Disposable filesystem sandbox\n- Network: Public Web Only / Airgap compliant`,
    sourcesDoc: `# Discovered Sources & References\n\n- ${opp.openSourceOptions.map((o) => `${o.name} (${o.url}) - License: ${o.license}`).join('\n- ')}`,
    licensesDoc: `# License Notice\n\nReleased under MIT License. Reused components comply with upstream Apache-2.0 and MIT requirements.`,
    sourceManifest: {
      project: name,
      generatedAt: new Date().toISOString(),
      verified: true,
      resources: opp.openSourceOptions
    },
    screenshots: [
      'screenshots/desktop_dashboard.png',
      'screenshots/mobile_view.png'
    ],
    workingDir: `/tmp/rnd-build-engine/${opp.id}`,
    runCommand: 'npm run dev'
  };
}
