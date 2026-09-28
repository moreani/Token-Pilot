# R&D Build Engine — Product Requirements Document (PRD)

**Working title:** R&D Build Engine  
**Document version:** 1.0  
**Status:** Build-ready specification  
**Primary goal:** Turn internet-discovered ideas into tested, working, customized software projects with minimal manual intervention.

---

## 1. Executive Summary

R&D Build Engine is a personal AI-powered research, discovery, and autonomous software-building workspace.

The system continuously searches the web for useful things worth building — including web apps, SaaS ideas, AI applications, developer tools, frameworks, libraries, open-source projects, website concepts, UI patterns, automation ideas, experiments, and emerging technologies.

When the user selects a work item, the system does **not** immediately start coding.

Instead, it performs a research phase that searches for:

- Existing GitHub/GitLab/open-source repositories
- Reusable Agent Skills / `SKILL.md` packages
- Frameworks and libraries
- Official documentation
- Existing implementation patterns
- UI/UX and website design references
- Useful CLI tools and developer tooling
- Testing strategies
- Known limitations and failure modes
- License and provenance information

The system then builds a **Build Pack** describing what should be reused, what should be rewritten, what should be added, what technologies should be selected, and how the project should be customized.

The selected project is then built inside an isolated workspace.

The system is explicitly designed to produce a **working project**, not merely a code draft.

After implementation, it runs a multi-layer validation pipeline:

1. Install/build validation
2. Static analysis
3. Unit tests
4. Integration tests
5. End-to-end browser tests
6. Visual QA
7. Accessibility checks
8. Security checks
9. Performance checks
10. Regression testing
11. AI-specific evaluation when applicable

When something fails, the system enters an automated diagnosis/fix/retest loop with bounded repair attempts.

The final result is a portable project package containing working source code, tests, documentation, screenshots, provenance/license information, and a final verification report.

---

# 2. Product Vision

## Vision Statement

> Find something worth building, discover the best existing knowledge and reusable resources, build a genuinely customized implementation, test it like a real product, automatically fix failures, and deliver a working project.

The system should behave like a combination of:

- Personal R&D researcher
- Open-source scout
- Technical researcher
- UI inspiration researcher
- Agent-skill librarian
- Software architect
- Coding agent
- QA engineer
- Security reviewer
- Performance engineer
- Portfolio/documentation assistant

The product should reduce the time between:

**“This is interesting.”**

and

**“Here is a working project I can run.”**

---

# 3. Problem Statement

A modern developer can discover thousands of interesting projects, frameworks, repositories, skills, templates, and design references. The problem is not lack of information.

The problem is:

- Too many possible ideas
- Difficult-to-search implementation knowledge
- Repeated research
- Existing repositories are difficult to evaluate quickly
- Useful agent skills are distributed across many sources
- Design references are disconnected from implementation
- Repositories often require significant setup and debugging
- AI-generated projects frequently fail at build/test/runtime stages
- Developers waste compute/AI credits on projects that are abandoned
- Existing code often needs substantial customization before it becomes useful
- License/provenance is easy to overlook
- A project that “looks complete” may not actually work

R&D Build Engine addresses this by creating a controlled pipeline from discovery to verified output.

---

# 4. Product Goals

## Primary goals

### G1 — Discover valuable work

Find interesting things worth experimenting with or building.

### G2 — Research before implementation

Find the best existing code, skills, frameworks, technical approaches and design references before spending significant compute.

### G3 — Reuse intelligently

Reuse compatible open-source resources and agent skills when permitted, while preserving provenance and license obligations.

### G4 — Build a customized implementation

Create a differentiated implementation rather than blindly copying a repository.

### G5 — Deliver working software

Do not mark a project complete until it passes project-appropriate automated checks.

### G6 — Automatically repair failures

Use bounded diagnose → patch → test loops.

### G7 — Maximize expiring AI quota

Use the available compute/AI credits on the highest-value work, with cost-aware model/tool selection.

### G8 — Build reusable knowledge

Store research, skills, successful patterns, failures, decisions and test strategies for future projects.

---

# 5. Non-Goals

The first version should NOT attempt to:

- Automatically scrape or copy arbitrary copyrighted websites.
- Remove required open-source attribution.
- Hide source origins.
- Bypass licenses or access controls.
- Build every discovered idea automatically.
- Support every programming language on day one.
- Guarantee that every project can be completed without human input.
- Use unrestricted autonomous internet actions.
- Deploy public production systems without user approval.
- Make unbounded autonomous changes to a user's existing repositories.
- Treat search-engine snippets as authoritative technical evidence.

The system should favor transparent provenance and reproducibility.

---

# 6. Core Product Principle

The system should follow this rule:

> **Research first. Build second. Verify third. Package last.**

A second rule is equally important:

> **Never call a project “working” because the code exists. It is working only when the relevant tests and runtime checks pass.**

---

# 7. Core User Journey

```text
DISCOVER
   ↓
SELECT
   ↓
RESEARCH
   ↓
BUILD PACK
   ↓
BOOTSTRAP
   ↓
CUSTOMIZE
   ↓
BUILD
   ↓
TEST
   ↓
AUTO-FIX
   ↓
VERIFY
   ↓
PACKAGE
   ↓
WORKING PROJECT
```

---

# 8. Six-Step Product Workflow

The existing six-step wizard should become:

## Step 1 — Discover

**Title:** Find Something Worth Building

User can:

- Browse recommendations
- Search manually
- Request random R&D ideas
- Select categories
- Define constraints
- Define available time
- Define desired technologies
- Define portfolio goals
- Define learning goals
- Define quota/credit limits

### Example prompts

- “Find something interesting to build today.”
- “Find AI tools I can rebuild locally.”
- “Find a useful web app with an open-source implementation.”
- “Find interesting React projects from the last 30 days.”
- “Find a website design I can turn into a real product.”
- “Find small tools I can finish in one day.”

---

## Step 2 — Select

**Title:** Choose Work

Display each opportunity as a card.

Each card should show:

- Project/idea name
- Category
- Short explanation
- Why it is interesting
- Potential implementation paths
- Existing open-source resources
- Estimated complexity
- Expected build duration
- Technologies involved
- Learning value
- Portfolio relevance
- Resource availability
- Known risks
- Research confidence

The user selects:

**Work on this**

---

# 9. Step 1 — Discovery Engine

## 9.1 Discovery categories

### Product ideas

- SaaS
- Utilities
- Productivity
- Developer tools
- Automation
- Internal tools
- Consumer apps
- Creator tools

### AI

- AI web apps
- AI agents
- RAG
- Local LLM applications
- Multimodal apps
- Computer use
- Browser automation
- AI workflow tools
- AI developer tooling
- MCP-compatible tools
- Evaluation tooling

### Web

- Landing pages
- Dashboards
- Data tools
- Interactive experiences
- WebGL
- Three.js
- Visualizations
- Browser utilities

### Developer ecosystem

- Frameworks
- Libraries
- Databases
- Build systems
- CLIs
- Testing frameworks
- Open-source tools
- Developer productivity tools

### Design

- Website concepts
- Dashboard designs
- Interaction patterns
- Animations
- Navigation patterns
- Design systems
- Responsive layouts

### Random R&D

Cross-category discovery designed to surface unexpected opportunities.

---

# 10. Discovery Source Strategy

The engine should use multiple evidence sources.

## Priority order

1. Official project website/documentation
2. Official GitHub repository
3. Official technical documentation
4. Maintainer documentation
5. Reputable technical sources
6. Community resources
7. Search results and social discussion for discovery only

Search results should be treated primarily as discovery signals. Important technical claims should be verified against authoritative sources when possible.

---

# 11. Opportunity Scout

For each discovered idea, generate an opportunity record.

## Opportunity record

```json
{
  "title": "",
  "category": "",
  "summary": "",
  "problem": "",
  "why_now": "",
  "potential_users": [],
  "existing_products": [],
  "open_source_options": [],
  "available_skills": [],
  "design_references": [],
  "recommended_stack": [],
  "complexity": "low|medium|high",
  "estimated_duration": "",
  "learning_value": "",
  "portfolio_relevance": "",
  "research_confidence": "",
  "known_risks": [],
  "suggested_mode": "explore|experiment|build"
}
```

---

# 12. Opportunity Ranking

Do not use one universal “best idea” score.

Instead, expose separate dimensions:

- Novelty
- Resource availability
- Implementation difficulty
- Learning value
- Portfolio relevance
- Reuse potential
- Testing feasibility
- Time-to-working-build
- Dependency risk
- License clarity
- Research confidence

The user can choose how to prioritize these dimensions.

---

# 13. Execution Modes

## Explore

Research only.

Output:

- idea
- resources
- architecture
- implementation possibilities
- risks

No code is required.

## Experiment

Create a small proof of concept.

Typical target:

- one core workflow
- minimal UI
- minimal data layer
- basic tests

## Build

Produce a complete working application.

Includes full testing and packaging.

---

# 14. Step 3 — Research Engine

When the user clicks **Work on this**, research begins.

The system should create a research workspace.

```text
research/
  idea.md
  repositories.json
  skills.json
  frameworks.json
  design-references.json
  technical-references.json
  license-analysis.json
  architecture-options.md
  research-log.md
```

---

# 15. Repository Discovery

Search for existing implementations on:

- GitHub
- GitLab
- Codeberg
- Other legitimate public source hosts

For GitHub, the system can use repository search/API capabilities where appropriate. GitHub documents REST API access for retrieving repository data and automating workflows. citeturn951220search1

## Repository search criteria

Search by:

- Exact concept
- Synonyms
- Main functionality
- Technical pattern
- Framework
- UI description
- Architecture pattern

Example:

```text
"AI screenshot to website"
"screenshot website generator"
"image to React UI"
"AI landing page generator"
```

---

# 16. Repository Evaluation

Do not choose repositories only by star count.

Evaluate:

- Relevance
- License
- Activity
- Documentation
- Code quality
- Architecture
- Buildability
- Dependency health
- Test coverage
- Similarity
- Extensibility
- Complexity
- Maintenance status

Output:

```text
Repository:
Purpose:
License:
Activity:
Tech stack:
Architecture:
Build status:
Tests:
Reusable modules:
Potential reuse:
Potential problems:
Why selected:
```

---

# 17. Agent Skill Discovery

The engine should search for reusable agent skills.

Preferred pattern:

```text
skill-name/
  SKILL.md
  agents/
  scripts/
  references/
  assets/
```

Modern Agent Skills conventions package reusable expertise and workflows in portable folders centered around `SKILL.md`; bundled scripts, references and assets can be included. citeturn951220search3turn951220search13

The engine should recognize:

- `SKILL.md`
- `.agents/skills`
- `.github/skills`
- `.claude/skills`
- other documented skill conventions
- `AGENTS.md`
- `CLAUDE.md`
- project-level agent instructions
- tool/plugin documentation

---

# 18. Skill Evaluation

For each candidate skill:

```text
name
source
version/commit
description
trigger conditions
dependencies
compatibility
license
quality signals
scripts
references
assets
last updated
```

The agent should decide:

- Install
- Use as reference
- Ignore
- Requires modification
- Conflicts with selected stack

---

# 19. Skill Compatibility Layer

Before installing a skill, check:

```text
Current project stack
+
Skill requirements
+
Runtime compatibility
+
Available tools
+
Operating system
+
Language
+
Framework
```

Potential output:

```text
✅ Compatible
⚠️ Compatible with changes
❌ Incompatible
```

---

# 20. Framework and Library Research

For every proposed stack, search for:

- Official documentation
- Current version
- Installation method
- Compatibility
- Examples
- Known limitations
- Migration information

The agent must prefer official documentation for framework behavior.

---

# 21. Design Research Engine

For website/UI projects, create a design research pack.

Search for:

- Layout patterns
- Navigation patterns
- Hero sections
- Dashboards
- Forms
- Cards
- Modals
- Mobile patterns
- Loading states
- Empty states
- Error states
- Animation patterns
- Interaction patterns

The system should extract **design patterns**, not simply copy complete pages.

---

# 22. Design Reference Record

```json
{
  "title": "",
  "source": "",
  "type": "landing|dashboard|component|interaction|animation",
  "useful_patterns": [],
  "notes": "",
  "implementation_notes": ""
}
```

---

# 23. License and Provenance Engine

This is mandatory.

For each external resource, capture:

```text
Source URL
Repository
Commit/version
License
Copyright/attribution requirements
Usage restrictions
Modification requirements
Included files/modules
```

GitHub's documentation notes that a repository license determines what others can and cannot do with the source, and recommends keeping license information explicit; GitHub also supports searching repositories by license family. citeturn951220search0turn951220search2

## Rules

### Allowed

Use a resource when its license permits the intended use.

### Required

Preserve:

- Required copyright notices
- Required license files
- Attribution requirements
- Source notices where applicable

### Block

If licensing is:

- Unknown
- Ambiguous
- Clearly incompatible
- Access-restricted
- Explicitly non-reusable

the system must not automatically incorporate the code.

It may still use the resource for research/reference where lawful and appropriate.

---

# 24. Source Manifest

Every build should generate:

```text
SOURCES.md
LICENSES.md
source-manifest.json
```

Example:

```json
{
  "resources": [
    {
      "name": "resource-name",
      "source": "repository-or-page",
      "commit": "",
      "license": "MIT",
      "usage": "reference|modified|included",
      "attribution": true
    }
  ]
}
```

---

# 25. Build Pack

After research, the system generates a Build Pack.

## Build Pack contains

### Project definition

- Name
- Goal
- Target users
- Main workflow
- Success criteria

### Architecture

- Frontend
- Backend
- Database
- AI layer
- External tools
- Storage
- Authentication

### Resource selection

- Base repository
- Selected skills
- Selected libraries
- Selected frameworks
- Design references

### Implementation strategy

- What is reused
- What is rewritten
- What is added
- What is removed
- What is redesigned

### Test strategy

- Unit tests
- Integration tests
- E2E flows
- Visual QA
- Security checks
- Performance checks

### Provenance

- Sources
- Licenses
- Attribution requirements

---

# 26. Build Pack Example

```text
Project:
FrameCheck AI

Base implementation:
Repository A

Skills:
- frontend-ui
- browser-testing
- image-analysis

Framework:
Next.js

UI direction:
Dashboard reference B

New functionality:
- responsive analysis
- accessibility scan
- export report

Rewrite requirements:
- new project structure
- new visual identity
- new user workflow

Testing:
- Vitest
- Playwright
- visual snapshots

Delivery:
- README
- architecture
- source manifest
- screenshots
```

---

# 27. Step 4 — Project Bootstrap

Create an isolated workspace.

Recommended structure:

```text
workspace/
├── project/
├── research/
├── skills/
├── sources/
├── tests/
├── artifacts/
├── logs/
├── reports/
└── metadata/
```

---

# 28. Sandbox Requirements

Each project should run in an isolated environment.

The sandbox should:

- Limit filesystem access
- Isolate processes
- Restrict outbound network access where appropriate
- Record executed commands
- Capture stdout/stderr
- Support project-specific dependencies
- Support disposable environments
- Prevent host contamination

---

# 29. Bootstrap Pipeline

```text
Create workspace
↓
Initialize repository
↓
Install selected skill packages
↓
Install dependencies
↓
Run baseline build
↓
Run baseline tests
↓
Record failures
↓
Create implementation branch
↓
Begin customization
```

---

# 30. Customization Engine

The customization engine is responsible for producing the user's implementation.

Customization can include:

- Product name
- Branding
- UI
- Color system
- Typography
- Navigation
- Component structure
- Feature set
- Database schema
- API structure
- Architecture
- Prompt design
- Error handling
- Documentation
- Testing strategy

The goal is not to merely rename an existing project.

The system should produce a meaningfully customized implementation.

---

# 31. Originality Rules

The system should distinguish:

### Direct reuse

Permitted only when license/terms allow it.

### Adaptation

Modify permitted open-source code to fit the selected architecture.

### Reference

Study an implementation without copying its source.

### New implementation

Re-implement the concept independently.

### Blocked

Do not incorporate code when licensing or access rights are incompatible.

The system must never remove required attribution or license information.

---

# 32. Implementation Agent

The implementation agent receives:

- Build Pack
- Selected skills
- Project workspace
- Architecture plan
- Research findings
- Provenance rules
- Definition of Done

It must follow a staged plan.

---

# 33. Implementation Loop

```text
Plan
↓
Implement one feature
↓
Run relevant tests
↓
Inspect output
↓
Commit checkpoint
↓
Continue
```

Do not modify the entire codebase blindly in a single pass.

---

# 34. Git Checkpoint Strategy

Create checkpoints:

```text
checkpoint-001-bootstrap
checkpoint-002-core-feature
checkpoint-003-ui
checkpoint-004-integration
checkpoint-005-testing
checkpoint-006-polish
```

This makes failures reversible.

---

# 35. Step 5 — Testing Engine

Testing is a mandatory completion phase.

A project cannot enter `READY` without passing the project-specific Definition of Done.

---

# 36. Testing Stage 1 — Dependency / Install Test

Verify:

- dependency installation
- lockfile validity
- environment setup
- native dependency requirements
- missing files
- missing environment variables
- incompatible versions

---

# 37. Testing Stage 2 — Build Test

Run appropriate build commands.

Examples:

```bash
npm run build
npm run typecheck
npm run lint
```

Equivalent commands should be detected for other ecosystems.

Capture:

- exit code
- errors
- warnings
- duration

---

# 38. Testing Stage 3 — Static Analysis

Potential checks:

- Lint
- Type checking
- Formatting
- Dependency analysis
- Dead-code detection
- Import errors
- Circular dependency detection

---

# 39. Testing Stage 4 — Unit Testing

The agent identifies important units and creates tests.

Prioritize:

- business logic
- data transformations
- parsing
- validation
- calculations
- authentication logic
- error handling
- critical AI utilities

Do not create meaningless tests just to increase coverage.

---

# 40. Testing Stage 5 — Integration Testing

Test components together.

Examples:

```text
API → database
Frontend → API
Worker → queue
Agent → tool
Upload → processing → output
```

---

# 41. Testing Stage 6 — End-to-End Testing

For web applications, browser automation should exercise real user flows.

Playwright is a suitable default candidate because it supports browser automation, end-to-end testing, tracing, assertions, and multiple browser engines. It can run Chromium, Firefox and WebKit and supports device emulation. citeturn951220search11turn951220search4

Typical flow:

```text
Open app
↓
Navigate
↓
Login/register
↓
Perform core action
↓
Verify result
↓
Test error state
↓
Logout
```

---

# 42. Testing Stage 7 — Visual QA

Capture screenshots at:

- Desktop
- Tablet
- Mobile

Check:

- Overflow
- Layout breaks
- Missing elements
- Incorrect spacing
- Typography problems
- Broken images
- Responsive issues
- Unexpected rendering
- Console errors

For important applications, generate visual snapshots for regression.

---

# 43. Testing Stage 8 — Accessibility QA

Check:

- Keyboard navigation
- Focus states
- Labels
- Semantic HTML
- Contrast
- Form accessibility
- Screen-reader basics
- Missing alt text
- Interactive element accessibility

---

# 44. Testing Stage 9 — Security QA

Check:

- Hardcoded credentials
- Secrets
- Unsafe dependencies
- Injection risks
- Authentication
- Authorization
- Input validation
- File upload handling
- URL handling
- Command execution
- Path traversal
- Unsafe deserialization
- Sensitive data exposure

For AI applications additionally check:

- Prompt injection
- Tool misuse
- Untrusted content
- Data leakage
- Unsafe tool calls
- Output validation

---

# 45. Testing Stage 10 — Performance QA

Measure when relevant:

- Build size
- Bundle size
- Page load
- API latency
- Database performance
- Image size
- Number of requests
- Memory usage
- CPU usage

The agent should only optimize when there is evidence of a problem.

---

# 46. Testing Stage 11 — AI Evaluation

For AI products, create evaluation cases.

Example:

```text
Input
Expected behavior
Actual output
Pass/fail
```

Evaluate:

- Correctness
- Structured output
- Tool use
- Failure handling
- Retrieval quality
- Prompt injection resistance
- Consistency
- Latency

---

# 47. Regression Testing

Whenever the agent fixes a failure:

```text
Run failed test
+
Run related tests
+
Run previously passing critical tests
```

The agent must avoid “fixing one thing by breaking another.”

---

# 48. Auto-Fix Engine

## Core loop

```text
Test
↓
Failure
↓
Collect evidence
↓
Diagnose
↓
Generate patch
↓
Apply patch
↓
Run targeted test
↓
Run regression tests
```

Maximum retry count should be configurable.

Default:

**5 repair cycles per failure group**

After the limit:

```text
FAILED — HUMAN REVIEW REQUIRED
```

---

# 49. Failure Classification

Classify errors as:

### Environment

- Missing dependency
- Missing browser
- Port conflict
- OS dependency

### Build

- Compilation
- Type error
- Import
- Configuration

### Runtime

- Crash
- Exception
- Timeout

### Logic

- Wrong behavior
- Incorrect output

### Test

- Test implementation issue
- Product implementation issue

### External

- Third-party service unavailable
- Rate limit
- Network failure

### Security

- Secret
- Vulnerability
- Unsafe behavior

---

# 50. Evidence-First Debugging

Every auto-fix must store:

```text
failure
evidence
hypothesis
change
test command
result
```

This should prevent agents from making random edits.

---

# 51. Step 6 — Delivery

A project reaches `READY` only when:

- Build passes
- Critical tests pass
- E2E passes where applicable
- Security checks have no unresolved critical findings
- Required environment documentation exists
- Provenance is recorded
- README exists
- Run instructions work

---

# 52. Final Project Package

```text
project/
├── source/
├── tests/
├── docs/
├── screenshots/
├── research/
├── skills/
├── reports/
├── README.md
├── ARCHITECTURE.md
├── TESTING.md
├── SECURITY.md
├── SOURCES.md
├── LICENSES.md
├── CHANGELOG.md
└── source-manifest.json
```

Not all folders need to be physically committed to GitHub. Some can remain as build artifacts.

---

# 53. Generated Documentation

At minimum:

## README.md

Include:

- What the project does
- Why it exists
- Main features
- Demo
- Setup
- Environment variables
- Usage
- Architecture overview
- Testing
- Limitations
- License/provenance notes

GitHub documentation notes that repository README files explain why a project is useful and how people can use it; topics and other repository metadata can also improve discoverability. citeturn951220search10turn951220search7

## ARCHITECTURE.md

Include:

- Components
- Data flow
- Dependencies
- Decisions
- Tradeoffs

## TESTING.md

Include:

- Test commands
- Test categories
- Coverage where meaningful
- E2E scenarios
- Known limitations

## SOURCES.md

Include:

- External repositories
- Documentation
- Skills
- Design references

## LICENSES.md

Include:

- Included third-party licenses
- Attribution requirements

---

# 54. Portfolio Case Study Generator

Generate:

```text
Problem
Solution
Architecture
Implementation
Technical decisions
Interesting challenges
Testing
Security
Performance
What was learned
Future improvements
```

Do not fabricate metrics.

Only report metrics actually measured by the build/test system.

---

# 55. Credit / Quota Manager

This is a core component because the system exists partly to consume expiring AI credits productively.

Track:

```text
Provider
Model
Quota
Used
Remaining
Expiry
Estimated task cost
```

Before large tasks:

```text
Estimate
↓
Compare available budget
↓
Choose execution strategy
```

---

# 56. Cost-Aware Routing

The system should support:

### Cheap/local model

Good for:

- File inspection
- Repetitive edits
- Code transformation
- Formatting
- Test generation
- Simple bug fixes

### Strong model

Good for:

- Architecture
- Research synthesis
- Difficult debugging
- Security reasoning
- Complex feature planning
- Final review

### Browser/search agent

Good for:

- Web research
- Documentation
- Repository discovery
- Design research
- Current information

A provider abstraction should allow switching without changing the core workflow.

---

# 57. Local-First Execution Mode

The architecture should support a local-first mode where:

- Local models perform routine coding tasks
- Browser automation performs research
- Internet access is used for public research
- External AI APIs are optional adapters rather than mandatory dependencies

This keeps the core engine portable and reduces recurring API dependency.

---

# 58. Research Cache

Avoid repeating expensive searches.

Cache:

- Repository metadata
- Skills
- Documentation
- License information
- Framework research
- Design references
- Successful implementations

Each cache entry should have:

```text
retrieved_at
source
content_hash
version/commit where available
expiry/revalidation policy
```

---

# 59. Knowledge Library

Maintain a local knowledge base:

```text
knowledge/
├── skills/
├── repositories/
├── frameworks/
├── architecture/
├── testing/
├── security/
├── design/
└── lessons/
```

The engine should search this library before starting new research.

---

# 60. Reusable Skill Registry

Store every installed skill with metadata.

```json
{
  "name": "frontend-ui",
  "source": "",
  "version": "",
  "license": "",
  "compatibility": [],
  "installed_at": "",
  "last_validated": ""
}
```

---

# 61. Project Memory

For each completed project, remember:

- Research sources
- Selected repositories
- Skills used
- Framework decisions
- Architecture decisions
- Failed approaches
- Successful fixes
- Test strategies
- Common bugs

Future projects can reuse this knowledge.

---

# 62. Agent Architecture

Use specialized agents rather than one giant agent.

## Discovery Agent

Find ideas.

## Research Agent

Research repositories, skills, tools, frameworks.

## Design Research Agent

Research UI/UX references.

## Architecture Agent

Construct implementation strategy.

## Bootstrap Agent

Prepare workspace.

## Coding Agent

Implement features.

## Test Agent

Create and run tests.

## Browser QA Agent

Run real user workflows.

## Security Agent

Audit security.

## Performance Agent

Inspect performance.

## Repair Agent

Diagnose failures and apply fixes.

## Documentation Agent

Generate documentation.

## Release Agent

Prepare final package.

---

# 63. Agent Orchestrator

The orchestrator controls:

- Which agent runs
- In what order
- What context is available
- What tools are allowed
- Retry limits
- Budget limits
- Checkpointing
- State transitions

---

# 64. Agent State Machine

```text
DISCOVERED
   ↓
SELECTED
   ↓
RESEARCHING
   ↓
RESEARCHED
   ↓
PLANNED
   ↓
BOOTSTRAPPING
   ↓
BUILDING
   ↓
TESTING
   ↓
REPAIRING
   ↓
VERIFYING
   ↓
PACKAGING
   ↓
READY
```

Failure states:

```text
BLOCKED
FAILED
NEEDS_HUMAN_REVIEW
CANCELLED
```

---

# 65. Project Metadata Model

```json
{
  "id": "",
  "title": "",
  "mode": "explore|experiment|build",
  "status": "",
  "description": "",
  "stack": [],
  "selected_resources": [],
  "selected_skills": [],
  "architecture": {},
  "definition_of_done": [],
  "test_plan": {},
  "budget": {},
  "provenance": [],
  "artifacts": [],
  "timestamps": {}
}
```

---

# 66. Research Item Model

```json
{
  "id": "",
  "type": "repository|skill|framework|design|tool|documentation",
  "title": "",
  "source": "",
  "license": "",
  "relevance": 0,
  "quality_signals": [],
  "compatibility": "",
  "decision": "use|reference|ignore|blocked",
  "reason": ""
}
```

---

# 67. Test Result Model

```json
{
  "test_id": "",
  "category": "build|unit|integration|e2e|visual|security|performance|ai",
  "command": "",
  "status": "pass|fail|skip",
  "duration_ms": 0,
  "evidence": [],
  "errors": [],
  "artifact_paths": []
}
```

---

# 68. UI — Main Dashboard

Show:

### Active build

- Project name
- Current step
- Agent currently running
- Current task
- Progress

### Quota

- Remaining credits
- Expiry
- Current estimated spend

### Recent projects

- Ready
- Building
- Failed
- Researching

### Discovery feed

- New ideas
- New tools
- New repositories
- New skills

---

# 69. UI — Discovery Page

Filters:

- AI
- Web
- SaaS
- Tools
- Design
- GitHub
- Automation
- Local AI
- Beginner
- Advanced
- Quick build
- Weekend project

Cards include:

- Idea
- Why interesting
- Existing implementations
- Estimated complexity
- Research status
- Start button

---

# 70. UI — Research Page

Sections:

### Repositories

Repository cards with:

- name
- relevance
- license
- activity
- stack
- buildability
- selected/not selected

### Skills

- skill name
- compatibility
- source
- license
- selected/not selected

### Design

- visual references
- implementation notes

### Frameworks

- compatibility
- official documentation
- migration concerns

---

# 71. UI — Build Plan

Display:

```text
Selected resources
↓
Architecture
↓
Features
↓
Customization
↓
Testing plan
↓
Definition of Done
```

Allow manual edits before execution.

---

# 72. UI — Live Build

Display:

- Current agent
- Current task
- File changes
- Commands
- Build output
- Tests
- Screenshots
- Errors
- Fix attempts

Avoid flooding the UI with raw logs. Provide expandable logs.

---

# 73. UI — Testing Dashboard

Show:

```text
BUILD                ✅
STATIC ANALYSIS      ✅
UNIT TESTS           ✅ 42/42
INTEGRATION          ✅ 18/18
E2E                  ✅ 11/11
VISUAL QA            ✅
ACCESSIBILITY        ✅
SECURITY             ⚠️
PERFORMANCE          ✅
```

---

# 74. UI — Final Result

Primary CTA:

## Open Working Project

Secondary:

- View code
- Open report
- View screenshots
- View architecture
- View tests
- View provenance
- Open terminal
- Export project

---

# 75. Recommended Technology Architecture

This is a suggested starting point, not a hard requirement.

## Frontend

- Next.js/React
- Tailwind
- Component library

## Orchestration backend

- Node.js/TypeScript or Python
- Job queue
- State machine
- WebSocket/SSE progress updates

## Storage

Initial:

- SQLite/PostgreSQL
- Filesystem artifact storage

## Search

Provider abstraction supporting:

- web search
- repository search
- local knowledge search

## Code execution

- Docker/isolated containers
- disposable workspaces

## Browser automation

Playwright is a strong default for browser-based testing and automation. citeturn951220search11

## Models

Provider abstraction:

```text
LocalModelAdapter
ExternalModelAdapter
BrowserAgentAdapter
```

The first implementation should not hard-code the entire platform to one model provider.

---

# 76. Suggested Repository Structure

```text
rnd-build-engine/
│
├── apps/
│   ├── web/
│   └── worker/
│
├── packages/
│   ├── orchestrator/
│   ├── research/
│   ├── discovery/
│   ├── github/
│   ├── skills/
│   ├── sandbox/
│   ├── testing/
│   ├── browser/
│   ├── provenance/
│   ├── quota/
│   ├── memory/
│   └── shared/
│
├── agents/
│   ├── discovery/
│   ├── researcher/
│   ├── architect/
│   ├── builder/
│   ├── tester/
│   ├── qa/
│   ├── security/
│   ├── repair/
│   └── release/
│
├── skills/
│
├── prompts/
│
├── schemas/
│
├── templates/
│
├── tests/
│
├── docs/
│
└── docker/
```

---

# 77. API Design

## POST `/api/discover`

Create a discovery job.

Input:

```json
{
  "query": "",
  "categories": [],
  "constraints": {
    "max_days": 2,
    "preferred_stack": [],
    "difficulty": "medium"
  }
}
```

---

## GET `/api/discover/:id`

Return discovery results.

---

## POST `/api/projects`

Create project from selected opportunity.

---

## POST `/api/projects/:id/research`

Start research.

---

## GET `/api/projects/:id/research`

Return:

- repos
- skills
- frameworks
- design references
- sources

---

## POST `/api/projects/:id/plan`

Generate Build Pack.

---

## POST `/api/projects/:id/build`

Start implementation.

---

## POST `/api/projects/:id/test`

Start test suite.

---

## POST `/api/projects/:id/repair`

Start repair cycle.

---

## GET `/api/projects/:id/status`

Return state machine status.

---

## GET `/api/projects/:id/artifacts`

List screenshots, reports, logs and builds.

---

# 78. Event System

Emit events:

```text
DISCOVERY_STARTED
IDEA_FOUND
IDEA_SELECTED

RESEARCH_STARTED
REPOSITORY_FOUND
SKILL_FOUND
DESIGN_FOUND
LICENSE_ANALYZED
BUILD_PACK_READY

BUILD_STARTED
FEATURE_STARTED
FEATURE_COMPLETED
BUILD_FAILED

TEST_STARTED
TEST_PASSED
TEST_FAILED

REPAIR_STARTED
REPAIR_COMPLETED

SECURITY_STARTED
SECURITY_COMPLETED

PACKAGING_STARTED
PROJECT_READY
PROJECT_BLOCKED
```

---

# 79. Security Requirements

The R&D engine itself will execute untrusted code.

This is a critical security area.

## Required controls

- Disposable sandbox
- Container isolation
- Resource limits
- Time limits
- Network controls
- Secret isolation
- No access to host credentials
- No access to unrelated filesystem
- Read/write workspace boundaries
- Command allow/deny rules
- Process cleanup

Never expose the user's personal tokens to an arbitrary cloned repository.

---

# 80. Credential Management

Keep separate:

### Research credentials

Used for APIs/search where necessary.

### GitHub credentials

Used only for explicitly authorized actions.

### Project secrets

Injected at runtime into isolated environments.

Never commit secrets to generated projects.

Generate `.env.example`, never a real `.env` containing secrets.

---

# 81. GitHub Integration Strategy

Version 1 should primarily:

- Search repositories
- Clone repositories
- Inspect metadata
- Inspect licenses
- Read public source
- Create local branches

Optional later capabilities:

- Create GitHub repo
- Push commits
- Create pull request
- Update topics/description
- Publish releases

All write operations should require explicit user approval.

---

# 82. Search Reliability

The system should record:

- Search query
- Source
- Retrieval time
- Source URL
- Evidence
- Confidence

Never claim:

> “No repository exists.”

Instead say:

> “No relevant repository was found in the searched sources.”

---

# 83. Research Deduplication

If multiple repositories contain the same project or mirror:

- detect duplicates
- identify canonical source
- avoid cloning multiple copies unnecessarily

---

# 84. Design Reference Safety

Design research should extract:

- layout ideas
- interaction concepts
- component patterns
- visual principles

It should not automatically reproduce copyrighted assets, logos or proprietary content.

---

# 85. Discovery Freshness

Discovery results should include:

```text
Discovered:
Updated:
Last checked:
```

Current/fresh searches should be used for fast-changing topics.

---

# 86. Reliability Rules

The agent must:

- inspect before editing
- preserve checkpoints
- test before claiming success
- record evidence
- avoid speculative fixes
- stop when unsafe
- request manual review only when genuinely blocked

---

# 87. Human-in-the-Loop Checkpoints

User approval should be required before:

### Required approval

- Using a resource with unclear license
- Deploying publicly
- Sending external messages
- Pushing to a remote repository
- Deleting important files
- Using private credentials
- Making expensive operations above configured budget

### Optional approval

- Build Pack
- major architecture changes
- selected repository

A “fully autonomous” mode can come later.

---

# 88. Definition of Done

A build is READY when:

```text
[ ] Project installs
[ ] Project builds
[ ] Static checks pass
[ ] Core unit tests pass
[ ] Integration tests pass where applicable
[ ] E2E tests pass where applicable
[ ] Visual QA passes where applicable
[ ] Accessibility baseline passes
[ ] Security scan has no unresolved critical findings
[ ] Performance baseline completes where applicable
[ ] Regression tests pass
[ ] README generated
[ ] Setup instructions verified
[ ] Source/provenance recorded
[ ] License requirements preserved
[ ] Screenshots generated
[ ] Final report generated
```

---

# 89. Project Completion States

## READY

All required checks passed.

## READY_WITH_WARNINGS

Working but non-critical findings remain.

## BLOCKED

A dependency, license, credential, external service or human decision prevents completion.

## FAILED

System could not produce a working result within limits.

## NEEDS_HUMAN_REVIEW

System has insufficient confidence or a decision requiring user judgment.

---

# 90. Metrics

Track:

### Discovery

- Ideas discovered
- Ideas selected
- Research-to-build conversion

### Research

- Repositories found
- Skills found
- Useful resource ratio
- Research time

### Build

- Projects started
- Projects completed
- Average repair cycles
- Build time

### Testing

- Test count
- Pass rate
- Failures fixed automatically
- Regression failures

### Resource usage

- AI credits consumed
- AI credits remaining
- Research cost
- Build cost
- Test cost

### Quality

- Build success rate
- E2E success rate
- Security findings
- Reopened bugs
- Human intervention rate

---

# 91. Core Product KPI

The most important metric should be:

## Working Project Yield

```text
Number of projects reaching READY
÷
Number of build attempts
```

Secondary KPI:

## Time to Working Project

```text
Selection timestamp
→
READY timestamp
```

Another important KPI:

## Useful Credit Yield

```text
READY projects
÷
AI credits consumed
```

---

# 92. MVP Scope

Do not build everything at once.

## MVP Phase 1

### Discovery

- Manual prompt
- Web search
- Idea generation
- Opportunity cards

### Research

- GitHub repository search
- Skill search
- Official docs search
- License extraction

### Build

- One primary stack
- Isolated workspace
- Basic coding agent

### Test

- Build
- Lint/typecheck
- Unit tests
- Playwright E2E

### Delivery

- README
- Screenshots
- Final test report

---

# 93. MVP Phase 2

Add:

- Design research
- Visual QA
- Accessibility
- Security scan
- Auto-fix loops
- Project memory
- Resource cache
- Source manifests

---

# 94. Phase 3

Add:

- Performance testing
- AI evaluation
- Cost-aware model routing
- Local model integration
- advanced agent skills
- GitHub push/PR
- portfolio case study generation

---

# 95. Phase 4

Add:

- Continuous discovery
- scheduled R&D suggestions
- multi-project queues
- parallel project experiments
- reusable internal component library
- knowledge graph of skills/repos/frameworks

---

# 96. Example End-to-End Scenario

User enters:

> “Find me a useful AI web app to build today.”

Discovery returns:

```text
Idea:
AI Screenshot → Frontend Generator

Existing repos:
3 relevant repositories

Skills:
4 relevant skills

Frameworks:
Next.js
Tailwind
Playwright

Design references:
5

Difficulty:
Medium
```

User clicks:

**Work on this**

Research engine:

```text
Find repos
↓
Inspect licenses
↓
Find skills
↓
Inspect frameworks
↓
Find design references
↓
Build architecture options
```

System proposes:

```text
Base:
Repository A

Skills:
frontend-ui
browser-testing
image-analysis

New features:
responsive output
component extraction
accessibility audit
export

UI:
custom dashboard
```

User clicks:

**Build**

System:

```text
creates sandbox
↓
installs skills
↓
bootstraps project
↓
implements feature 1
↓
tests
↓
implements feature 2
↓
tests
↓
runs E2E
```

Suppose E2E fails:

```text
Login timeout
↓
diagnose
↓
fix selector
↓
run test
↓
PASS
```

Then:

```text
visual QA
↓
mobile overflow detected
↓
fix responsive layout
↓
re-run visual QA
↓
PASS
```

Finally:

```text
BUILD                ✅
UNIT                  ✅
INTEGRATION           ✅
E2E                   ✅
VISUAL                ✅
ACCESSIBILITY         ✅
SECURITY              ✅
PERFORMANCE           ✅
PROVENANCE            ✅

PROJECT READY
```

---

# 97. Example Final Output

```text
FrameCheck AI

Status:
READY ✅

Stack:
Next.js
TypeScript
Tailwind
PostgreSQL
Playwright

Features:
✓ Screenshot analysis
✓ Responsive inspection
✓ Accessibility checks
✓ Exportable report

Verification:
✓ Build
✓ 42 unit tests
✓ 11 E2E tests
✓ Visual QA
✓ Security QA

Artifacts:
README.md
ARCHITECTURE.md
TESTING.md
SECURITY.md
SOURCES.md
LICENSES.md
screenshots/
test-report/
```

---

# 98. Important Design Decision

The system should optimize for:

## “Working and useful”

not:

## “Lots of code”

A 1,500-line project that actually works is more valuable than a 15,000-line project full of generated code and broken flows.

---

# 99. Recommended First Build

The first version should itself be built as a web application.

### First working capabilities

```text
1. Discover idea
2. Select idea
3. Search GitHub
4. Search skills
5. Build research pack
6. Generate build plan
7. Create sandbox
8. Clone/initialize project
9. Run coding agent
10. Run build
11. Run tests
12. Run Playwright
13. Auto-fix failures
14. Generate final report
```

Everything else can be added after this loop is stable.

---

# 100. First Milestone

The first major milestone is NOT:

> “The UI is complete.”

It is:

> **Given one selected idea, the system can research it, find reusable resources, build a customized project in a sandbox, run tests, repair failures, and return a working application.**

That is the core proof that the product works.

---

# 101. Recommended Initial Test Project

Use a relatively small web application for the first internal proof of concept.

Requirements:

- Frontend
- API
- One database or persistence layer
- At least 3 user flows
- Responsive UI
- Automated browser test
- At least one external dependency

This forces the full pipeline to work without making the first experiment excessively complex.

---

# 102. Risks and Mitigations

## Risk: Bad discovery results

Mitigation:
Multi-source research + relevance filtering.

## Risk: Low-quality repository

Mitigation:
Buildability and activity analysis before selection.

## Risk: License problems

Mitigation:
Mandatory provenance and license gate.

## Risk: Agent copies code blindly

Mitigation:
Customization policy + provenance manifest + reference/reuse classification.

## Risk: Build fails

Mitigation:
Baseline build + repair loop.

## Risk: Tests are fake/useless

Mitigation:
Require behavioral assertions and E2E flows for user-facing applications.

## Risk: Agent gets stuck

Mitigation:
Bounded retries + failure classification + human review state.

## Risk: AI credits wasted

Mitigation:
Cost-aware routing and research-first filtering.

## Risk: Malicious repository

Mitigation:
Isolated sandbox, network restrictions, credential isolation.

## Risk: Visual quality is poor

Mitigation:
Visual QA + screenshot artifacts.

## Risk: Regression after fixes

Mitigation:
Regression suite after every significant fix.

## Risk: False completion

Mitigation:
READY requires evidence-backed checks.

---

# 103. Security Threat Model

Assume all external repositories are potentially untrusted.

Potential attack vectors:

- Malicious install scripts
- Dependency confusion
- Credential exfiltration
- Host filesystem access
- Network abuse
- Cryptomining
- Data theft
- Prompt injection through repository files
- Malicious test scripts
- Browser-based data exfiltration

Controls:

- Disposable containers
- CPU/memory/time limits
- No personal host credentials
- Explicit network policy
- Secrets injection only when required
- Command logs
- Kill switch
- Workspace isolation
- Tool permission boundaries

---

# 104. Agent Instruction Hierarchy

The orchestrator should make the following hierarchy explicit:

```text
System security rules
↓
User project requirements
↓
Project Build Pack
↓
Selected skill instructions
↓
Repository instructions
↓
Task-specific instructions
```

Repository-local instructions must not override platform security controls.

---

# 105. Research Evidence Requirements

Every major technical decision should contain:

```text
decision
reason
source
date checked
confidence
```

This makes the system auditable.

---

# 106. Audit Log

Store:

```text
who
when
agent
tool
input
command
output
file changes
decision
test result
```

This is useful for debugging the R&D engine itself.

---

# 107. Extensibility

Every provider should use an adapter interface.

Examples:

```text
SearchProvider
RepositoryProvider
SkillProvider
ModelProvider
BrowserProvider
SandboxProvider
StorageProvider
TestingProvider
DeploymentProvider
```

This keeps the platform modular.

---

# 108. Plugin/Skill Architecture

The system should allow a new skill to add:

```text
Instructions
Scripts
References
Assets
Tool permissions
```

Skills should be versioned and validated before installation.

---

# 109. Future Advanced Feature — Build Recipe

After successful projects, automatically save:

```text
BuildRecipe
```

Example:

```text
Problem:
Image analysis web app

Successful stack:
Next.js + PostgreSQL + Playwright

Skills:
frontend-ui
browser-testing
image-analysis

Testing:
unit + integration + E2E

Architecture:
API + worker + DB
```

Future projects can start from proven recipes.

---

# 110. Future Advanced Feature — R&D Graph

Build a knowledge graph:

```text
Idea
 ↓
Repository
 ↓
Skill
 ↓
Framework
 ↓
Architecture
 ↓
Test Strategy
 ↓
Successful Project
```

This can reveal combinations such as:

> “This skill has already worked successfully with these three frameworks.”

That creates compounding value over time.

---

# 111. Future Advanced Feature — Continuous Discovery

The engine can periodically search for:

- new tools
- new skills
- new frameworks
- interesting GitHub repositories
- new UI techniques
- new AI workflows

and surface only high-relevance opportunities.

This should remain opt-in and tightly scoped.

---

# 112. Future Advanced Feature — Expiry Sprint

When the user has credits expiring soon:

```text
EXPIRING CREDIT SPRINT

Credits remaining:
X

Expiry:
DATE

Recommended experiments:
1.
2.
3.
4.

Estimated consumption:
X

Expected outputs:
X working projects
```

The engine then prioritizes buildable experiments that fit the available window.

---

# 113. Acceptance Criteria — MVP

The MVP is accepted when:

### Discovery

- [ ] User can enter a natural-language goal.
- [ ] System returns multiple ideas.
- [ ] Ideas include evidence and sources.
- [ ] User can select an idea.

### Research

- [ ] System searches GitHub.
- [ ] System identifies relevant repositories.
- [ ] System identifies relevant skills.
- [ ] System identifies frameworks/tools.
- [ ] System records license information.
- [ ] System creates a Build Pack.

### Build

- [ ] System creates an isolated workspace.
- [ ] System can clone or initialize a project.
- [ ] System can apply selected skills.
- [ ] System can execute an implementation plan.
- [ ] System creates checkpoints.

### Testing

- [ ] Build test runs.
- [ ] Static checks run.
- [ ] Unit tests run.
- [ ] Integration tests run where applicable.
- [ ] Playwright E2E runs for web projects.
- [ ] Failures are captured.
- [ ] Repair loop can fix at least common build/test failures.

### Delivery

- [ ] Final project starts successfully.
- [ ] Final tests pass.
- [ ] README generated.
- [ ] Provenance generated.
- [ ] Screenshots generated.
- [ ] Final report generated.

---

# 114. Acceptance Criteria — Full Product

The full product is accepted when the system can:

1. Discover an idea from a natural-language goal.
2. Research the idea across multiple sources.
3. Locate reusable code and agent skills.
4. Evaluate resources for technical and license compatibility.
5. Generate a build strategy.
6. Create an isolated workspace.
7. Build a customized implementation.
8. Test it using multiple testing layers.
9. Automatically diagnose and repair common failures.
10. Re-run regression checks.
11. Generate documentation and artifacts.
12. Produce a reproducible working project.
13. Track all external sources and licenses.
14. Record the research/build/test history.
15. Optimize available AI credits.

---

# 115. Final Product Principle

The product should always answer three questions:

### Before building

**“What already exists that can help me do this faster and better?”**

### During building

**“What is the safest and most efficient way to turn this into my own working implementation?”**

### After building

**“Can I prove that this actually works?”**

If the system can answer all three reliably, it has achieved the original goal.

---

# 116. Reference Standards and Documentation

The implementation team should consult current official documentation while building:

- GitHub REST API documentation — repository discovery and automation. citeturn951220search1
- GitHub licensing documentation — license handling and repository license metadata. citeturn951220search0turn951220search2
- GitHub repository customization documentation — README/topics/repository presentation. citeturn951220search10turn951220search7
- Agent Skills documentation — portable skill packages centered on `SKILL.md`. citeturn951220search13turn951220search3
- Playwright documentation — browser automation and E2E testing. citeturn951220search11turn951220search4turn951220search5

These references should be revalidated during implementation because APIs, tools, and conventions can change.

---

# 117. Build Order

Implement in this order:

```text
Phase A
Project shell
→ dashboard
→ project state machine

Phase B
Discovery engine
→ search
→ opportunity cards

Phase C
Research engine
→ GitHub
→ skills
→ framework research
→ license/provenance

Phase D
Build engine
→ sandbox
→ bootstrap
→ coding agent
→ checkpoints

Phase E
Testing
→ build
→ unit
→ Playwright
→ regression

Phase F
Repair
→ failure parser
→ patch loop
→ retry budget

Phase G
Delivery
→ screenshots
→ README
→ source manifest
→ final report

Phase H
Optimization
→ quota manager
→ cache
→ project memory
```

Do not begin by building the entire “AI agent platform.”

First prove this single loop:

```text
IDEA
 ↓
RESEARCH
 ↓
REPO + SKILLS
 ↓
BUILD
 ↓
TEST
 ↓
FIX
 ↓
WORKING PROJECT
```

That is the heart of R&D Build Engine.

---

# 118. First Development Task

The first task for the coding agent should be:

> Build the six-step wizard and the project state machine, with mocked discovery/research/build/test data. Do not implement real autonomous coding yet. Make the UI and workflow state transitions fully functional so the rest of the system can plug into the stages independently.

After that, implement the real discovery → research → build → test pipeline one stage at a time.

---

# 119. Definition of the Product in One Sentence

> **R&D Build Engine is a personal AI software laboratory that discovers what is worth building, researches the best existing resources, assembles a build strategy, creates a customized implementation, tests it automatically, repairs failures, and delivers a verified working project.**
