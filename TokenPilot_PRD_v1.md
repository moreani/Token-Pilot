# TokenPilot Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** Build-ready draft  
**Date:** 2026-09-23  
**Product:** TokenPilot  
**Primary mode:** Local-first, manual execution only  
**Platforms:** macOS, Windows, Linux  
**Desktop shell:** Tauri  
**UI:** React + TypeScript  
**Local data:** SQLite  
**Sandbox:** Docker first, Podman-compatible abstraction  
**Quota intelligence:** `aiuse` as upstream data/decision layer  
**Browser execution:** Playwright + optional Jev fast path  
**Primary coding-agent targets:** Claude Code, Codex, OpenCode, Antigravity; Cursor initially may be monitor-only if safe execution is not reliable

---

## 1. Executive Summary

TokenPilot is a local-first desktop application that answers a simple question:

> **Which AI subscription/account am I at risk of wasting, and what useful task can I manually run with it right now?**

The user has multiple AI coding subscriptions and often multiple accounts within a provider. Different plans have different quota windows, reset times, limits, and overage behavior. Existing tools can expose quota information, but they do not provide a complete user-controlled workflow that turns expiring quota into productive work.

TokenPilot combines:

1. **Quota visibility**
   - Claude
   - Codex
   - Cursor
   - Antigravity / Gemini-style coding accounts
   - OpenCode-connected usage sources where available
   - Multiple accounts per provider

2. **Use-it-or-lose-it recommendations**
   - Reuse `aiuse` rather than rebuilding quota ranking.
   - Show which account is under-used relative to its reset window.
   - Never automatically spend quota.

3. **Manual productive jobs**
   - Repo Scout
   - Repo Lab
   - Skill Hunter
   - Skill Lab
   - Website Study
   - Website Recreate
   - Benchmark
   - Research
   - Custom Job

4. **Safe execution**
   - Every job requires an explicit final **RUN JOB** click.
   - Unknown repositories and downloaded code execute only inside a disposable sandbox.
   - No private repositories, SSH keys, browser profiles, or host project folders are exposed in V1.
   - No cloud TokenPilot account.
   - No TokenPilot inference proxy.
   - No automatic publishing, pushing, deployment, purchase, messaging, or paid overage.

5. **Efficient browser work**
   - Playwright is the deterministic browser and screenshot layer.
   - Jev may be used as an optional low-cost navigation fast path on public websites.
   - Jev is forbidden on sensitive/authenticated/private pages in V1.
   - Complex reasoning escalates to Claude/Codex only when needed.

TokenPilot's differentiation is not quota collection alone. The differentiator is:

> **Quota Dashboard → Useful Task → Manual Account Selection → Security Review → RUN JOB → Sandbox → Result**

---

# 2. Product Vision

Create a private command center for AI subscriptions that converts otherwise-unused paid capacity into useful R&D, research, testing, coding, and evaluation—without removing user control.

TokenPilot should feel like:

- a **quota dashboard**,
- a **manual R&D launcher**,
- a **safe experimentation lab**, and
- a **credit-efficiency assistant**.

It should not feel like:

- an autonomous bot spending quota on its own,
- a proxy intercepting private prompts,
- a cloud service that holds credentials,
- a replacement for Claude/Codex/OpenCode,
- or a scheduler that invents work merely to consume tokens.

---

# 3. Problem Statement

The user subscribes to multiple coding/AI products. Quota is fragmented across:

- providers,
- accounts,
- short and long reset windows,
- different quota semantics,
- soft limits,
- hard limits,
- paid overage,
- and multiple machines.

The user often cannot answer quickly:

- Which account should I use next?
- Which quota expires first?
- Am I behind pace on my weekly allowance?
- Is a fresh 5-hour window misleading because the weekly pool is almost unused?
- Is an account stale or lapsed?
- Which useful task can I perform before quota resets?
- Can I safely test an unknown GitHub repo without exposing my machine?
- Can I use cheaper browser automation before escalating to a larger model?

Existing projects solve pieces of this problem. TokenPilot should reuse those pieces and focus development on orchestration, UX, safety, and useful work.

---

# 4. Product Goals

## 4.1 Primary goals

### G1 — Unified account view
Show all supported AI subscriptions and accounts in one local dashboard.

### G2 — Accurate quota urgency
Show remaining quota, reset window, freshness, and burn/conserve/normal recommendation using `aiuse` semantics wherever supported.

### G3 — Multi-account support
Allow multiple accounts under the same provider with user-friendly aliases.

Example:

- Antigravity — Personal 1
- Antigravity — Personal 2
- Antigravity — Work
- Claude — Main
- Claude — Secondary
- Codex — Pro

### G4 — Manual execution only
No job runs without the user explicitly pressing **RUN JOB** on the final confirmation screen.

### G5 — Productive quota use
Provide predefined useful job types so remaining capacity creates useful output rather than junk traffic.

### G6 — Strong isolation
Unknown code must run inside a disposable sandbox with strict host isolation.

### G7 — Cross-platform from V1
macOS, Windows, and Linux should use the same product architecture.

### G8 — Reuse proven upstream components
Avoid wasting development tokens rebuilding quota logic or browser primitives already available.

---

# 5. Non-Goals for V1

TokenPilot V1 will NOT:

- automatically spend expiring quota,
- run scheduled burn jobs,
- sync across machines,
- create a TokenPilot cloud account,
- expose its local UI over LAN,
- route normal Claude/Codex/OpenCode prompts through a TokenPilot proxy,
- access private GitHub repositories,
- mount real user projects into unknown-code sandboxes,
- read SSH keys,
- read password managers,
- read browser cookies for ordinary operation,
- deploy applications,
- publish npm/PyPI packages,
- push Git commits,
- send email or messages,
- make purchases,
- enable paid overage automatically,
- reproduce full token/cost accounting across every provider in V1,
- promise exact future quota consumption for a job.

Historical token/session accounting can be added later using tools such as `ccusage` or provider-specific local logs.

---

# 6. Product Principles

## P1 — Human authorization is the execution boundary
Recommendations can be automatic. Execution cannot.

## P2 — Local first
TokenPilot state and history stay on the local computer.

## P3 — Provider direct
Credentials should be used only with the provider/collector that needs them. TokenPilot does not become an inference middleman.

## P4 — Minimum privilege
Every job gets the smallest set of capabilities required.

## P5 — Unknown code is hostile until proven otherwise
Public GitHub code can be cloned, installed, and run only inside a disposable sandbox.

## P6 — Reuse before rebuild
Use `aiuse` contracts for quota semantics. Use Playwright for deterministic browsing. Use Jev only where it measurably reduces browser-agent cost.

## P7 — Degrade gracefully
If one provider collector fails, the rest of the dashboard remains usable.

## P8 — No fake precision
Quota-consumption estimates must be labelled as estimates and use ranges where appropriate.

## P9 — Observable actions
The user should be able to answer: "What did TokenPilot actually do?"

---

# 7. Primary User

Initial target:

- Power user with several AI coding subscriptions.
- Uses Claude Code, Codex, OpenCode, Cursor, and Antigravity.
- May have multiple accounts per provider.
- Wants to maximize paid subscription value.
- Comfortable with GitHub and developer tooling.
- Wants useful R&D tasks to consume excess quota.
- Does not want important source code or credentials unintentionally exposed.

V1 is single-user and single-machine per installation.

---

# 8. High-Level Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                         TOKENPILOT                           │
│                                                              │
│  System Tray / Menu Bar          Local React Dashboard       │
│          │                                │                  │
│          └───────────────┬────────────────┘                  │
│                          ↓                                   │
│                     LOCAL CORE API                           │
│                    127.0.0.1 ONLY                            │
│                          │                                   │
│     ┌────────────────────┼──────────────────────┐            │
│     ↓                    ↓                      ↓            │
│ QUOTA LAYER         JOB ORCHESTRATOR       AUDIT STORE      │
│     │                    │                      │            │
│ aiuse adapter             │                    SQLite         │
│ provider adapters         │                                   │
│                           ↓                                   │
│                    SANDBOX MANAGER                            │
│                           │                                   │
│                 Docker / Podman adapter                       │
│                           │                                   │
│        ┌──────────────────┼────────────────────┐              │
│        ↓                  ↓                    ↓              │
│   Agent Runner       Browser Router        Job Tools          │
│        │                  │                    │              │
│ Claude/Codex/       Playwright/Jev       git/npm/pip/etc.     │
│ OpenCode/etc.                                                │
└──────────────────────────────────────────────────────────────┘
```

---

# 9. Recommended Technology Stack

## Desktop
**Tauri**

Reasons:

- cross-platform,
- lightweight compared with Electron,
- system tray/menu bar support,
- good local-native integration,
- suitable for localhost or embedded web UI.

## Frontend
- React
- TypeScript
- Vite
- TanStack Query or equivalent for local API state
- lightweight chart library only where necessary

## Core service
Recommended V1:

- Rust/Tauri commands for privileged local operations and process control
- TypeScript frontend for UI
- Optional small Python sidecar only if needed for `aiuse` integration

Do not rewrite `aiuse` into Rust for V1.

## Persistence
SQLite.

## Sandbox
Docker primary implementation.

Abstract via:

```ts
interface SandboxProvider {
  doctor(): Promise<SandboxDoctorResult>
  create(spec: SandboxSpec): Promise<SandboxHandle>
  exec(handle: SandboxHandle, command: CommandSpec): Promise<CommandResult>
  pause(handle: SandboxHandle): Promise<void>
  stop(handle: SandboxHandle): Promise<void>
  destroy(handle: SandboxHandle): Promise<void>
  exportFiles(handle: SandboxHandle, paths: string[]): Promise<ExportBundle>
}
```

Podman should be implementable without changing job logic.

## Browser
Playwright primary.

Jev optional fast path for safe public-web navigation.

---

# 10. Upstream Reuse Strategy

## 10.1 `aiuse`: use, do not fork

TokenPilot should treat `aiuse` as an upstream quota intelligence component.

Reuse:

- `aiuse --json`
- `aiuse suggest --json`
- `aiuse serve`
- stable JSON contract
- shared quota semantics
- provider/window identity logic
- pace rules
- golden fixtures

TokenPilot should NOT:

- duplicate `aiuse` quota-ranking logic in V1,
- patch `aiuse` directly unless a blocker is discovered,
- hard-wire internal Python modules into the application.

Create an adapter:

```ts
interface QuotaSource {
  doctor(): Promise<QuotaDoctorResult>
  snapshot(): Promise<QuotaSnapshot>
  suggestion(): Promise<QuotaSuggestion | null>
}
```

Implementation:

```text
AiuseQuotaSource
```

Initial integration priority:

1. Prefer long-lived `aiuse serve` when stable and available.
2. Fall back to `aiuse -q --json`.
3. Use `aiuse suggest --json` for the compact recommendation path.
4. Validate parsed data against copied/versioned contract fixtures.

TokenPilot should not interpret exit code `2` as "burn now" without inspecting JSON, because actionable alerts can include burn and conserve states.

## 10.2 Shared quota semantics

Vendor a versioned copy of language-neutral schemas/fixtures from upstream into:

```text
vendor/aiuse-shared-quota-semantics/
```

Record:

- upstream commit hash,
- copy date,
- semantic package version,
- local compatibility tests.

Purpose:

- protect TokenPilot against upstream CLI refactors,
- allow future native implementation,
- test parsing independently of live provider accounts.

## 10.3 `ccusage` and historical cost data

Not required for V1.

Phase 1.1 may add:

- Claude local token counts,
- API-equivalent cost estimates,
- token usage by session/project,
- historical burn-rate analytics.

The V1 priority is remaining subscription quota and useful manual jobs.

---

# 11. Provider Capability Model

Do not assume every provider supports every operation.

Each provider/account reports capabilities.

```ts
type ProviderCapabilities = {
  trackUsage: boolean
  remainingQuota: boolean
  resetTime: boolean
  executeJobs: boolean
  switchAccount: boolean
  directApi: boolean
  cli: boolean
  supportsPaidOverageDetection: boolean
}
```

Example:

```json
{
  "provider": "antigravity",
  "accountAlias": "Personal 3",
  "capabilities": {
    "trackUsage": true,
    "remainingQuota": true,
    "resetTime": true,
    "executeJobs": true,
    "switchAccount": true,
    "directApi": false,
    "cli": true,
    "supportsPaidOverageDetection": false
  }
}
```

V1 rule:

> Track every supported provider. Automate execution only where the adapter is reliable and safe.

Cursor may therefore appear as:

```text
TRACK ✓
RUN —
```

without blocking the rest of TokenPilot.

---

# 12. Account Model

Each account has a stable TokenPilot ID independent of upstream aliases.

```ts
type Account = {
  id: string
  providerId: string
  displayAlias: string
  upstreamIdentities: string[]
  capabilities: ProviderCapabilities
  authStatus: "ready" | "missing" | "expired" | "error"
  lastSeenAt: string | null
  enabled: boolean
}
```

The UI allows aliases such as:

- "Antigravity Personal 1"
- "Antigravity Personal 2"
- "Claude Main"
- "Claude Spare"
- "Codex Pro"

Do not store raw passwords.

TokenPilot may store references/metadata required to find existing local CLI credentials, but secret material must remain in the OS/provider-managed credential location whenever possible.

---

# 13. Dashboard Requirements

## 13.1 Top summary

Display:

- number of tracked accounts,
- accounts with fresh quota data,
- accounts with errors,
- highest "use soon" recommendation,
- last refresh time,
- refresh button,
- **USE MY CREDIT** primary CTA.

Example:

```text
TOKENPILOT

12 accounts tracked     10 fresh     1 warning

🔥 USE SOON
Antigravity — Personal 3
78% remaining · resets in 18h

[ USE MY CREDIT ]
```

## 13.2 Account cards

For each account show:

- provider logo/name,
- alias,
- quota used/remaining,
- reset countdown,
- window type,
- status: Burn / On Pace / Conserve / Empty / Unknown / Error,
- data freshness,
- execution capability,
- optional monetary-at-risk estimate if supplied by quota source.

## 13.3 Multiple windows

When a provider has multiple windows, show them without naively ranking a fresh short window over a shared longer allotment.

Example:

```text
Claude Main

5h window       84% remaining
Weekly window   63% remaining

Recommendation: USE
Driven by: weekly shared allotment
```

Use `aiuse` semantics rather than inventing separate ranking.

---

# 14. Recommendation / Productive Burn Layer

TokenPilot does not need to recreate the upstream scoring formula in V1.

TokenPilot consumes:

- normalized quota state,
- recommendation classification,
- suggestion,
- reset information,
- confidence/freshness where available.

TokenPilot then adds a **job recommendation layer**.

Example:

```text
🔥 78% of Antigravity Personal 3 remains.
Reset in 18h.

Useful things you could do:

[ Evaluate a GitHub repo ]
[ Find and test a new skill ]
[ Recreate a website UI ]
[ Benchmark agents ]
[ Research a topic ]
```

No job starts here.

## 14.1 Recommendation categories

- Burn / Use soon
- Normal / On pace
- Conserve
- Unknown
- Data stale
- Account unavailable

## 14.2 No automatic account selection

TokenPilot may pre-highlight a recommended account but user must explicitly select/confirm the account during job configuration.

---

# 15. Main Job Library

V1 should include eight job types.

## J1 — Repo Scout

Purpose:
Find relevant public GitHub repositories and produce a shortlist.

Inputs:

- topic/query,
- maximum results,
- optional languages,
- optional minimum stars,
- optional recency constraint.

Actions:

- search public web/GitHub,
- inspect README/docs,
- inspect high-level project metadata,
- produce shortlist.

Default permissions:

- network: yes,
- shell: minimal/no unknown execution,
- clone: optional,
- arbitrary code execution: no.

Output:

- ranked candidates,
- relevance notes,
- maintenance signals,
- license,
- installation complexity,
- recommended next action.

---

## J2 — Repo Lab

Purpose:
Safely test a public GitHub repository.

Inputs:

- repository HTTPS URL,
- branch/tag optional,
- objective,
- install policy,
- test policy.

Actions:

- create sandbox,
- clone repo,
- inspect instructions,
- install dependencies,
- run tests,
- perform a small realistic use case,
- generate report.

Default permissions:

- network: yes,
- shell: yes inside sandbox,
- arbitrary code: yes inside sandbox,
- host filesystem: no.

---

## J3 — Skill Hunter

Purpose:
Find useful `SKILL.md`-style agent skills.

Inputs:

- objective,
- sources,
- max candidates,
- desired agent compatibility.

Actions:

- search public repos/skill registries,
- inspect skill metadata,
- identify dependencies/permissions,
- produce shortlist.

Output fields:

- skill name,
- source,
- agents supported,
- permissions,
- external dependencies,
- security notes,
- suitability.

---

## J4 — Skill Lab

Purpose:
Test a selected skill in isolation.

Inputs:

- skill source,
- test task,
- runtime limit,
- network permission,
- shell permission.

Actions:

- create sandbox,
- fetch skill,
- inspect it,
- execute realistic test,
- record result,
- report whether to keep/reject.

---

## J5 — Website Study

Purpose:
Analyze the design and interaction system of a public website.

Inputs:

- URL,
- pages/depth,
- features to inspect:
  - layout,
  - typography,
  - tokens,
  - responsive behavior,
  - components,
  - animation,
  - interactions.

Actions:

- public browser exploration,
- screenshots,
- DOM/style inspection where appropriate,
- interaction map,
- design-system summary.

No cloning/building required.

---

## J6 — Website Recreate

Purpose:
Build a design-study implementation based on a public reference site.

Inputs:

- reference URL,
- target framework,
- selected features,
- asset policy,
- desired fidelity.

Default target:

- React/Vite project in sandbox.

Actions:

1. reconnaissance,
2. screenshots and state capture,
3. design-system extraction,
4. component plan,
5. implementation,
6. responsive rendering,
7. visual QA,
8. iterative fixes,
9. result bundle.

Default policy:

- do not copy logos/trademarks unless user explicitly supplies/owns them,
- do not scrape paywalled content,
- create replacement assets/placeholders where appropriate.

---

## J7 — Benchmark

Purpose:
Run the same well-defined task through selected agent/provider adapters.

Inputs:

- task,
- candidate providers/accounts,
- max runtime,
- success criteria.

Outputs:

- completion status,
- elapsed time,
- observable tool calls,
- token/quota data where available,
- test results,
- artifact quality checks.

V1 should avoid subjective opaque composite scores unless criteria are explicit.

---

## J8 — Research

Purpose:
Perform web/GitHub research and return a structured local report.

Inputs:

- question,
- depth,
- source categories,
- output format.

Execution can use browser/external search adapters, not private user files in V1.

---

# 16. Custom Job

A Custom Job allows free-form instruction but still requires:

- selected provider/account,
- security profile,
- explicit capabilities,
- final confirmation.

Custom jobs cannot bypass V1 prohibited capabilities.

A prompt cannot grant:

- host filesystem access,
- private repo access,
- git push,
- deployment,
- paid overage,
- browser-cookie access.

Product policy beats prompt text.

---

# 17. Manual Run Confirmation Flow

This section is a hard product contract.

## Screen 1 — Dashboard

User sees quota and clicks:

**USE MY CREDIT**

No AI execution occurs.

---

## Screen 2 — Choose Job

User selects one of:

- Repo Scout
- Repo Lab
- Skill Hunter
- Skill Lab
- Website Study
- Website Recreate
- Benchmark
- Research
- Custom Job

Each card displays:

- expected workload: Low / Medium / High,
- network requirement,
- whether unknown code may execute,
- expected output.

Button label:

**SELECT**

Never **RUN** at this stage.

---

## Screen 3 — Configure Job

Common fields:

### Job Name
Optional.

### Objective
Required.

Validation:

- min 10 chars,
- max 10,000 chars by default,
- non-empty after trimming,
- secret-pattern warning.

If likely secret detected:

```text
⚠ Possible credential detected.

TokenPilot recommends removing secrets
from the job description.

[ EDIT ]
[ CONTINUE ANYWAY ]
```

Continuing requires user action and creates an audit event.

Job-specific fields are defined in Section 15.

---

## Screen 4 — Select Provider and Account

TokenPilot may recommend an account but does not silently select it.

Display per option:

- provider,
- account alias,
- remaining quota,
- reset countdown,
- collector freshness,
- execution capability,
- auth status.

The user selects one account.

If selected account is monitor-only:

```text
This account can be tracked but cannot run TokenPilot jobs yet.
```

RUN path is disabled.

---

## Screen 5 — Security and Budget

### Budget

Fields:

- workload class,
- maximum wall-clock runtime,
- maximum agent turns where supported,
- maximum retry attempts,
- stop on rate limit,
- stop on hard quota,
- stop on auth failure,
- stop before paid overage,
- optional quota reserve floor.

Default quota reserve:

- configurable,
- suggested 10–15%,
- never enforced if provider cannot reliably report remaining allowance.

Show estimated quota use as:

- Low,
- Medium,
- High,
- or a broad range.

Never promise exact percentage.

### Security profile

V1 default:

**BALANCED SANDBOX**

Show clear permissions:

```text
Filesystem
✓ Disposable workspace only
✗ Home directory
✗ Documents
✗ Desktop
✗ SSH keys
✗ browser profiles

Repositories
✓ Public repositories specified by job
✗ Private repositories

Network
✓ HTTPS internet where required
✓ GitHub where required
✓ package registries where required
✓ selected AI provider

Credentials
✓ only selected job/provider credential
✗ unrelated provider credentials
✗ browser cookies
✗ password manager

Actions
✓ clone in sandbox
✓ read
✓ compile
✓ test
✓ run in sandbox

✗ git push
✗ publish
✗ deploy
✗ email/message
✗ purchase
```

---

## Screen 6 — Run Preview

Show a human-readable execution plan.

Example:

```text
READY TO RUN

JOB
Test OpenMontage for AI-song-video automation

AI
Antigravity
Account: Personal 3

QUOTA
78% remaining
Reset: 18h 42m
Recommendation: Use soon

TOKENPILOT WILL

1. Create disposable sandbox
2. Clone the public repository
3. Read documentation
4. Inspect setup instructions
5. Install dependencies inside sandbox
6. Run available tests
7. Perform a realistic test
8. Produce Markdown report

NETWORK
✓ GitHub
✓ approved package registries
✓ selected provider

FILESYSTEM
✓ sandbox only
✗ rest of computer

TOKENPILOT WILL NOT
✗ access private repos
✗ read SSH keys
✗ access browser cookies
✗ modify existing projects
✗ git push
✗ publish
✗ deploy
```

CTA:

**REVIEW & RUN**

This CTA performs preflight checks but is still non-executing.

---

## Preflight Validation

Preflight may perform safe local checks.

### Provider checks
- account exists,
- auth metadata available,
- execution adapter installed,
- quota data fresh enough,
- provider adapter healthy.

### Runtime checks
- Docker/Podman available,
- disk space sufficient,
- required base image available or safely obtainable,
- TokenPilot core service healthy.

### Job checks
- required fields complete,
- URLs parse,
- repository URL is allowed,
- timeouts valid,
- selected job template available.

### Security checks
- no host filesystem mounts,
- no wildcard secrets,
- network policy generated,
- output directory safe,
- prohibited capabilities absent.

### Concurrency checks
- selected account is not in a conflicting TokenPilot run,
- local concurrency cap not exceeded.

If preflight fails, final run button is disabled.

---

## Screen 7 — Final Confirmation

Example:

```text
READY

Test OpenMontage

Using:
Antigravity / Personal 3

Current quota:
78% remaining

Security:
Balanced Sandbox

Maximum runtime:
30 minutes

Unknown repository code may execute
inside an isolated sandbox.

Nothing has executed yet.

[ CANCEL ]               [ RUN JOB ]
```

There must be exactly one unambiguous final authorization control:

# RUN JOB

No earlier screen uses this label.

---

# 18. Exact Execution Boundary

This is a hard invariant.

## Before RUN JOB

TokenPilot may:

- refresh quota,
- read local configuration,
- calculate recommendations,
- validate inputs,
- inspect its own metadata,
- check Docker/Podman,
- test availability of known local executables,
- generate security policy,
- perform non-mutating local health checks.

TokenPilot must NOT:

- call an AI agent to perform the job,
- spend selected inference quota for the job,
- clone the target repo,
- execute target-repo code,
- install target dependencies,
- browse the target website for task execution,
- launch Jev against the target,
- launch job Playwright browsing.

## User presses RUN JOB

Create immutable `ExecutionIntent`.

```ts
type ExecutionIntent = {
  jobId: string
  userConfirmed: true
  confirmedAt: string
  providerId: string
  accountId: string
  securityProfileId: string
  jobSpecHash: string
  permissionsHash: string
}
```

Persist it.

Transition:

```text
AWAITING_CONFIRMATION
→ AUTHORIZED
```

## Sandbox preparation

After authorization:

```text
AUTHORIZED
→ PREPARING_SANDBOX
→ SANDBOX_READY
```

Required before job execution:

- isolated container exists,
- security policy applied,
- workspace mount is empty/job-scoped,
- required credential exposure is minimal,
- host directories are not mounted,
- network rules installed,
- isolation self-check passes.

If any isolation step fails:

```text
FAILED_PRESTART
```

No agent launches.

## Exact point actual work begins

The job becomes `RUNNING` at the first of:

- first AI-provider task request, or
- first external job command inside the verified sandbox.

Record:

```text
firstExecutionAt
```

This timestamp defines quota-consuming/work execution start.

---

# 19. Job State Machine

```text
DRAFT
  ↓
CONFIGURED
  ↓
READY_FOR_REVIEW
  ↓
PREFLIGHT
  ↓
AWAITING_CONFIRMATION
  ↓
AUTHORIZED
  ↓
PREPARING_SANDBOX
  ↓
SANDBOX_READY
  ↓
STARTING_AGENT
  ↓
RUNNING
  ├──→ PAUSING → PAUSED → RUNNING
  ├──→ COMPLETED
  ├──→ FAILED
  ├──→ CANCELLED
  └──→ SECURITY_BLOCKED
```

Illegal transition:

```text
AWAITING_CONFIRMATION → RUNNING
```

must be impossible in code.

---

# 20. Running Job Screen

Show:

- job name,
- provider/account,
- elapsed time,
- current step,
- high-level progress,
- quota before/current where reliably measurable,
- security events,
- action log,
- Pause,
- Stop.

Example:

```text
OPENMONTAGE TEST

RUNNING

Provider:
Antigravity / Personal 3

Elapsed:
08:42

✓ Sandbox created
✓ Repository cloned
✓ Documentation analysed
✓ Dependencies installed
● Running tests
○ Building use case
○ Final report

[ PAUSE ]                    [ STOP ]
```

---

# 21. Pause Behavior

Pause means:

- stop issuing new AI requests,
- stop launching new commands,
- allow current atomic operation to settle when safe,
- retain sandbox,
- retain results.

State:

```text
RUNNING → PAUSING → PAUSED
```

Resume requires user action.

---

# 22. Stop Behavior

Click Stop:

```text
Stop this job?

Current results will be retained.

[ KEEP RUNNING ]
[ STOP JOB ]
```

On confirm:

- terminate agent process,
- terminate active browser executor,
- stop job commands,
- preserve sandbox temporarily for review,
- state = CANCELLED.

---

# 23. Runtime Permission Escalation

Jobs cannot silently expand permissions.

Example:

```text
PERMISSION REQUEST

The job wants to download Chromium.

Reason:
Required for screenshot comparison.

Host:
approved browser binary source

[ DENY ]
[ ALLOW FOR THIS JOB ]
```

Escalations are:

- one-job only,
- logged,
- not automatically remembered globally.

Host filesystem access to prohibited paths should be blocked outright in V1 rather than escalatable.

---

# 24. Quota Safety During Execution

Where reliable live quota refresh is available:

- periodically refresh at a conservative rate,
- show before/current,
- stop or pause when reserve threshold is reached.

Example:

```text
Starting quota: 78%
Current quota: 42%
Reserve floor: 15%
```

If floor reached:

```text
Quota reserve reached.

The job has been paused.

[ END JOB ]
[ CONTINUE ANYWAY ]
```

"Continue anyway" may be offered only if:
- provider does not imply paid overage, or
- paid overage is separately handled.

---

# 25. Paid Overage Protection

Default:

```text
ALLOW_PAID_OVERAGE = false
```

If provider detects allowance exhaustion and extra billing may begin:

```text
Subscription allowance exhausted.

Continuing may create additional charges.

[ END JOB ]
[ ENABLE PAID OVERAGE & CONTINUE ]
```

The second action requires explicit confirmation and creates a high-severity audit event.

V1 may omit paid-overage continuation entirely and always stop if detection is uncertain.

---

# 26. Results Screen

Display:

- job status,
- duration,
- provider/account,
- quota before/after where available,
- output summary,
- files produced,
- errors/warnings,
- security events,
- buttons:
  - View Report
  - Open Sandbox
  - Export Result
  - Delete Everything

No generated files automatically enter real user projects.

---

# 27. Export Flow

User chooses **EXPORT RESULT**.

Default export excludes:

- `.env`,
- credentials,
- browser profiles,
- dependency caches,
- `node_modules`,
- provider auth files,
- SSH material,
- sandbox internals.

Run secret scan before export.

If suspected secret:

```text
⚠ Possible secret detected

prototype/.env

This file will not be exported.
```

V1 default export directory:

```text
~/TokenPilot/Exports/<job-slug>/
```

Use platform-correct equivalent on Windows.

---

# 28. Delete Everything

Delete:

- sandbox,
- checkout,
- temporary browser profile,
- temporary credentials,
- package caches owned by job,
- generated work files not exported.

Retain minimal metadata:

- job ID/name,
- job type,
- provider/account alias,
- timestamps,
- status,
- quota before/after,
- security events,
- final result status.

Raw prompts are not required for retained history in V1.

---

# 29. Audit Event Model

```ts
type AuditEvent = {
  id: string
  jobId: string | null
  severity: "debug" | "info" | "warning" | "critical"
  category:
    | "quota"
    | "authorization"
    | "sandbox"
    | "network"
    | "filesystem"
    | "credential"
    | "provider"
    | "browser"
    | "execution"
    | "export"
  action: string
  detail?: Record<string, unknown>
  createdAt: string
}
```

Example timeline:

```text
18:40 Job created
18:41 Preflight passed
18:41 User authorized execution
18:41 Sandbox created
18:42 Agent started
18:42 First provider request
18:46 Host filesystem request blocked
18:52 User allowed Chromium download
19:04 Job completed
19:05 Result exported
19:06 Sandbox deleted
```

---

# 30. Security Model

## 30.1 Trust boundaries

### Trusted
- TokenPilot signed application code
- TokenPilot local SQLite DB
- TokenPilot local core service
- user-selected provider adapters
- approved base sandbox images

### Semi-trusted
- `aiuse`
- installed provider CLIs
- Playwright/browser binaries
- optional Jev client

### Untrusted
- arbitrary GitHub repos
- arbitrary websites
- downloaded package dependencies
- discovered skills
- generated shell commands
- repository install scripts

---

# 31. Balanced Sandbox Profile

Default V1 policy:

```text
Internet             ✓ when required
Public GitHub         ✓
Package registries    ✓ approved hosts
Selected AI provider  ✓

Sandbox filesystem    ✓
Host filesystem       ✗

Public repos          ✓
Private repos         ✗

Run downloaded code   ✓ sandbox only
Install dependencies  ✓ sandbox only

Browser cookies       ✗
SSH keys              ✗
Password manager      ✗

Git push              ✗
Publishing            ✗
Deployment            ✗
Purchases             ✗
Email/messages        ✗
```

No "allow everything" button.

---

# 32. Network Security

Default deny outside required destinations where practical.

At minimum, classify destinations:

- provider endpoints,
- GitHub,
- package registries,
- public target websites,
- browser binary download sources,
- unknown.

Log new domains contacted by a job.

Block from website jobs:

- `file://`,
- loopback destinations,
- RFC1918/private LAN addresses,
- link-local addresses,
- common cloud metadata endpoints,
- localhost services.

This prevents a public URL from being used as an SSRF bridge into local services.

---

# 33. Repository URL Validation

Allowed by default:

```text
https://github.com/<owner>/<repo>
```

Potential future:
other public HTTPS Git hosts.

Reject or require explicit future support:

- `file://`
- `ssh://`
- local paths
- URLs with embedded credentials
- private repository URLs
- scp-style Git SSH syntax

---

# 34. Secret Handling

TokenPilot must:

- avoid copying all host environment variables into sandbox,
- inject only selected required credential material,
- use ephemeral files/env where supported,
- remove ephemeral credentials at job end,
- redact secrets from logs,
- scan exports,
- never display full tokens in UI.

Credential access should be adapter-specific.

---

# 35. Browser Execution Architecture

Create a browser router:

```ts
interface BrowserExecutor {
  id: string
  supports(task: BrowserTask): boolean
  estimate(task: BrowserTask): BrowserEstimate
  run(task: BrowserTask, ctx: BrowserRunContext): Promise<BrowserRunResult>
}
```

Implement:

```text
PlaywrightExecutor
JevExecutor
LargeModelBrowserExecutor (future/fallback)
```

Routing:

```text
Need deterministic screenshot/DOM?
    → Playwright

Simple public-web navigation with safe data?
    → Jev candidate

Sensitive/authenticated/private page?
    → Jev forbidden

Complex ambiguous reasoning?
    → Playwright extraction + Claude/Codex reasoning
```

---

# 36. Jev Integration

Jev is **optional** and must never be a foundational dependency.

Use cases:

- public GitHub navigation,
- public documentation navigation,
- public search pages,
- finding links/buttons,
- exploring public website interactions,
- low-cost first-pass navigation.

Do NOT use Jev for:

- provider billing/account pages,
- private GitHub,
- authenticated internal sites,
- localhost TokenPilot,
- local apps,
- private source code,
- pages containing user secrets,
- browser profiles with personal sessions.

## 36.1 Privacy rule

Current Jev behavior sends structured page state to TypeSafe, including page URL/title/text, visible element information, and recent actions. `TYPE_TEXT` may call a configured OpenAI-compatible text model.

Therefore:

```text
JEV_SECURITY_CLASS = PUBLIC_WEB_ONLY
```

V1 UI should make this explicit.

## 36.2 Jev executor contract

Input:

```ts
type JevTask = {
  goal: string
  startUrl: string
  allowedHosts: string[]
  maxSteps: number
  sensitive: false
}
```

Output:

```ts
type JevResult = {
  status: "done" | "blocked" | "failed" | "max_steps"
  finalUrl: string
  actions: JevActionSummary[]
  evidence: BrowserEvidence
}
```

A Jev `DONE` response does NOT prove task success.

TokenPilot must independently verify outcome using deterministic evidence:

- expected URL,
- DOM text,
- selected state,
- screenshot,
- downloaded file existence,
- page state assertion.

## 36.3 Escalation

```text
Jev attempt
   ├── success + deterministic verification → continue
   ├── low confidence / blocked → Playwright or large-model route
   └── unsafe/sensitive classification → never call Jev
```

---

# 37. Playwright Responsibilities

Playwright should handle:

- page loading,
- deterministic selectors,
- screenshots,
- viewport testing,
- responsive states,
- DOM extraction,
- computed-style extraction where useful,
- visual state capture,
- interaction verification,
- download handling,
- final website recreation QA.

Use browser contexts isolated per job.

Do not reuse the user's normal browser profile.

---

# 38. Website Recreate Detailed Pipeline

```text
User enters URL
  ↓
Validate public HTTPS target
  ↓
Final RUN authorization
  ↓
Sandbox + browser context
  ↓
Reconnaissance
  ├─ Jev for public navigation when appropriate
  └─ Playwright deterministic capture
  ↓
Capture
  ├─ screenshots
  ├─ key DOM structure
  ├─ typography
  ├─ spacing
  ├─ responsive breakpoints
  ├─ interactions
  └─ animation observations
  ↓
Design specification
  ↓
Claude/Codex implementation
  ↓
Local render
  ↓
Playwright screenshots
  ↓
Visual QA
  ↓
Fix loop
  ↓
Result bundle
```

Do not route screenshots through Jev unless future Jev capability explicitly supports it and product policy changes.

---

# 39. Repo Lab Detailed Pipeline

```text
RUN JOB
  ↓
Sandbox ready
  ↓
git clone public repo
  ↓
Static inspection
  ├─ README
  ├─ package/requirements
  ├─ install scripts
  ├─ Dockerfile
  ├─ AGENTS/CLAUDE instructions
  └─ license
  ↓
Risk classifier
  ↓
Install
  ↓
Tests
  ↓
Minimal realistic use case
  ↓
Report
```

If installation requests dangerous behavior such as:

- privileged host access,
- Docker socket mount,
- system service installation,
- `curl | bash` from unknown host,
- host network mode,
- mounting `$HOME`,

pause/block and request permission only where V1 policy permits.

Host filesystem or Docker socket access should remain prohibited.

---

# 40. Skill Lab Detailed Pipeline

Before executing a skill:

1. Parse `SKILL.md`.
2. Identify claimed tools/capabilities.
3. Extract commands/dependencies.
4. Classify:
   - network,
   - shell,
   - filesystem,
   - browser,
   - credentials,
   - external APIs.
5. Compare against job permissions.
6. Display mismatches.
7. Execute only after normal final RUN confirmation.

Do not treat skill prose as trusted system policy.

TokenPilot policy has higher priority than downloaded skill instructions.

---

# 41. Agent Runner Layer

Define a stable interface:

```ts
interface AgentRunner {
  id: string
  providerId: string

  doctor(account: Account): Promise<AgentDoctorResult>

  start(input: {
    account: Account
    sandbox: SandboxHandle
    objective: string
    maxTurns?: number
    timeoutMs: number
    allowedTools: string[]
  }): Promise<AgentSession>

  pause(session: AgentSession): Promise<void>
  resume(session: AgentSession): Promise<void>
  stop(session: AgentSession): Promise<void>
}
```

Implement adapters incrementally.

Target priority:

1. Codex
2. Claude Code
3. OpenCode
4. Antigravity, when a reliable CLI/session path is confirmed
5. Cursor only when safe automation contract is stable

Tracking support is independent of runner support.

---

# 42. Job Tool Router

Agents should not receive unrestricted host shell.

Inside sandbox expose a controlled toolset:

- shell,
- file read/write,
- git read/clone,
- package manager,
- browser,
- test runner,
- report writer.

TokenPilot controls which tools exist per job.

---

# 43. Data Model

## 43.1 Provider

```ts
type Provider = {
  id: string
  displayName: string
  iconKey: string
  enabled: boolean
}
```

## 43.2 Account

Defined in Section 12.

## 43.3 Quota snapshot

```ts
type QuotaWindow = {
  id: string
  label: string
  usedFraction: number | null
  remainingFraction: number | null
  resetsAt: string | null
  observedAt: string
  source: string
}

type AccountQuotaSnapshot = {
  accountId: string
  windows: QuotaWindow[]
  recommendation:
    | "burn"
    | "on_pace"
    | "conserve"
    | "empty"
    | "unknown"
    | "error"
  recommendationReason?: string
  freshness: "fresh" | "stale" | "too_stale"
  rawSourceVersion?: string
}
```

Retain raw `aiuse` response separately for debugging, with rotation and secret redaction.

## 43.4 Job

```ts
type Job = {
  id: string
  type: JobType
  name: string
  objective: string
  state: JobState
  providerId: string | null
  accountId: string | null
  securityProfileId: string
  specJson: unknown
  permissionsJson: unknown
  createdAt: string
  updatedAt: string
  authorizedAt: string | null
  firstExecutionAt: string | null
  completedAt: string | null
}
```

## 43.5 Job result

```ts
type JobResult = {
  jobId: string
  summaryMarkdown: string | null
  resultJson: unknown | null
  artifactManifest: ArtifactManifestItem[]
  quotaBeforeJson: unknown | null
  quotaAfterJson: unknown | null
}
```

---

# 44. SQLite Tables

Suggested V1:

```text
providers
accounts
quota_snapshots
jobs
execution_intents
job_events
security_events
job_artifacts
settings
upstream_health
```

Do not store provider passwords.

---

# 45. Local API

All interfaces loopback-only.

Recommended base:

```text
http://127.0.0.1:<dynamic-or-fixed-port>/api/v1
```

Tauri may call native commands directly for some operations, but keep a clear logical API boundary.

Suggested endpoints:

```text
GET    /health
GET    /providers
GET    /accounts
PATCH  /accounts/:id
POST   /quota/refresh
GET    /quota/latest
GET    /quota/suggestion

GET    /jobs
POST   /jobs
GET    /jobs/:id
PATCH  /jobs/:id
POST   /jobs/:id/preflight
POST   /jobs/:id/authorize
POST   /jobs/:id/start
POST   /jobs/:id/pause
POST   /jobs/:id/resume
POST   /jobs/:id/stop

GET    /jobs/:id/events
GET    /jobs/:id/artifacts
POST   /jobs/:id/export
DELETE /jobs/:id/sandbox

GET    /system/doctor
GET    /system/dependencies
GET    /settings
PATCH  /settings
```

Critical API invariant:

`/start` requires a valid stored `ExecutionIntent` whose hashes match the current job spec and permissions.

Changing job/provider/permissions after authorization invalidates the authorization and returns the job to `AWAITING_CONFIRMATION`.

---

# 46. Authorization Hashing

At final confirmation calculate:

```text
jobSpecHash = SHA256(canonical job spec)
permissionsHash = SHA256(canonical permission set)
```

Store in `ExecutionIntent`.

Before sandbox creation and before first execution verify hashes again.

If mismatch:

```text
AUTHORIZATION_INVALIDATED
```

Require user review and RUN JOB again.

---

# 47. Validation Rules

## Objective
- required,
- trimmed min 10 chars,
- max default 10,000.

## Public URL
- `https://` preferred,
- `http://` optional with warning,
- no embedded credentials,
- no private IP resolution,
- no loopback,
- no `file://`.

## GitHub repo
- public HTTPS URL,
- owner/repo format,
- no SSH in V1.

## Runtime
- min 1 minute,
- max configurable,
- default 30 min,
- V1 maximum suggested 120 min.

## Retries
- default 1–2,
- never retry a browser mutation blindly,
- provider retry policy must distinguish transient errors from quota/auth failures.

## Quota freshness
Default UI classification:

- Fresh: <= 5 min
- Stale: >5 and <=30 min
- Too stale: >30 min

Before final Run:
- refresh if too stale,
- permit user override only if collector cannot refresh and UI clearly says recommendation may be inaccurate.

---

# 48. Error Handling

Errors must be scoped.

Examples:

### Collector failure
```text
Claude Main quota unavailable.
Other accounts refreshed successfully.
```

### Sandbox unavailable
```text
Docker is not running.
Job cannot start.
```

### Provider auth failure
```text
Codex account authentication is unavailable.
No quota-consuming request was sent.
```

### Jev unavailable
Fall back to Playwright/other route if job can continue.

### Jev blocked
Do not keep retrying. Escalate.

### Rate limit
Pause and show provider state.

### Job code failure
Capture logs, mark job failed, retain sandbox for review.

---

# 49. System Tray / Menu Bar

Cross-platform tray should show:

- TokenPilot icon,
- top quota alert,
- refresh,
- open dashboard,
- running jobs count,
- pause/stop active job shortcut,
- quit.

Example:

```text
TokenPilot

🔥 Antigravity Personal 3
78% remaining · 18h

[ Use My Credit ]
[ Refresh Quota ]
[ Open Dashboard ]

No jobs running
```

Tray action **Use My Credit** only opens UI. It never starts execution.

---

# 50. Settings

## General
- start at login,
- theme,
- refresh interval,
- quota freshness limits.

## Quota
- enabled providers,
- `aiuse` binary path,
- use `aiuse serve`,
- fallback CLI mode,
- display monetary-at-risk if available.

## Accounts
- alias,
- enabled/disabled,
- monitor-only status,
- execution adapter.

## Jobs
- default runtime,
- retry count,
- quota reserve,
- default output directory.

## Security
- Balanced Sandbox fixed/default,
- allowed package registries,
- Jev enabled/disabled,
- Jev public-web-only lock,
- export secret scanning.

## Developer
- raw adapter diagnostics,
- schema versions,
- upstream health,
- verbose audit logging.

---

# 51. Onboarding

First run wizard:

## Step 1 — Welcome
Explain local-first/manual-execution design.

## Step 2 — System Doctor
Check:

- `aiuse`
- Docker/Podman
- git
- Node/package manager
- Python/uv if needed
- provider CLIs
- Playwright readiness
- optional Jev readiness

## Step 3 — Discover accounts
Read quota collector output and show discovered accounts.

## Step 4 — Alias accounts
Let user name them.

## Step 5 — Execution readiness
Show which accounts are:

- Track + Run
- Track only
- Not configured

## Step 6 — Security
Explain sandbox and manual Run requirement.

## Step 7 — Dashboard

No remote signup.

---

# 52. `doctor` Experience

Provide a single diagnostics page:

```text
QUOTA
✓ aiuse found
✓ aiuse JSON contract parsed
✓ Claude collector
✓ Codex collector
! Antigravity account 3 stale
— Cursor execution not supported

EXECUTION
✓ Docker
✓ git
✓ Codex CLI
✓ Claude Code
! OpenCode not authenticated

BROWSER
✓ Playwright
✓ Chromium
✓ Jev installed
! Jev API key missing
```

Jev missing must not block core product.

---

# 53. Cross-Platform Requirements

## macOS
- Keychain-aware provider CLIs may work through their existing tools.
- Tauri tray/menu bar.
- Docker Desktop / compatible runtime.

## Windows
- Windows Credential Manager/provider CLI behavior differs.
- Docker Desktop/WSL2 considerations.
- Do not assume Unix paths or shell.
- Prefer structured process invocation over shell strings.

## Linux
- Secret service/keyring varies.
- Docker/Podman common.
- Tray behavior may differ by desktop environment.

Core rule:

> TokenPilot must report unsupported collectors/adapters clearly rather than pretending all macOS-specific upstream collectors work everywhere.

---

# 54. Process Execution Safety

Never build shell commands by concatenating raw user input.

Use:

- executable + argument array,
- explicit working directory,
- sanitized environment,
- timeout,
- max output size,
- cancellation token.

Inside sandbox:

- non-root user by default,
- dropped capabilities,
- no privileged mode,
- no host PID namespace,
- no Docker socket,
- no host network,
- read-only root filesystem where compatible,
- writable job workspace only,
- memory/CPU/PID limits.

---

# 55. Sandbox Spec

```ts
type SandboxSpec = {
  jobId: string
  image: string
  cpuLimit: number
  memoryMb: number
  pidsLimit: number
  timeoutMs: number
  networkPolicy: NetworkPolicy
  env: Record<string, SecretRef | string>
  mounts: SandboxMount[]
}
```

Default mounts:

```text
/workspace   writable, job-owned
/output      writable, job-owned
```

No `$HOME` host mount.

---

# 56. Base Sandbox Images

Start with a small set:

```text
tokenpilot/base-node
tokenpilot/base-python
tokenpilot/base-general
tokenpilot/browser
```

Pin versions and hashes.

Do not pull arbitrary repo-specified base images without explicit policy.

---

# 57. Observability

V1 metrics stored locally:

- quota refresh duration,
- collector success/failure,
- job duration,
- sandbox startup time,
- provider runner status,
- browser executor selected,
- number of Jev steps,
- Jev fallback count,
- Playwright actions,
- security blocks,
- artifacts produced.

No telemetry leaves machine by default.

---

# 58. Privacy

TokenPilot must not send its own telemetry by default.

External data transfer occurs only as inherent to selected job/provider actions.

The UI should be able to display:

```text
This job may send data to:
- selected AI provider
- GitHub
- package registry
- public target website
- TypeSafe/Jev (only if Jev enabled and task is public)
```

This disclosure appears before Run when Jev is expected.

---

# 59. Jev Cost-Saving Strategy

Jev's purpose is runtime efficiency, not core application development.

Good:

```text
public page
→ indexed action space
→ cheap action decision
→ deterministic verification
```

Bad:

```text
private dashboard
→ send page state to third party
```

Use Jev when:

- page is public,
- action space is simple,
- no sensitive data,
- expected navigation cost is meaningful.

Use Playwright directly when:

- known selectors,
- screenshots,
- DOM extraction,
- responsive capture,
- final verification.

Use Claude/Codex reasoning when:

- architecture/design interpretation,
- code generation,
- ambiguous task decomposition,
- deep evaluation.

---

# 60. Token/Cost Efficiency Principles

## Development-time savings
1. Reuse `aiuse`.
2. Do not fork unless necessary.
3. Reuse Playwright.
4. Use Tauri rather than writing platform shells independently.
5. Keep provider adapters small.
6. Build job templates over a common engine.
7. Use schemas/contracts and golden fixtures.

## Runtime savings
1. deterministic code before model calls,
2. narrow model context,
3. Jev for cheap public navigation,
4. shortlist before deep model evaluation,
5. send only relevant repo files,
6. cache public metadata,
7. avoid repeated screenshots unless needed,
8. route simple extraction to code, not LLMs.

---

# 61. Suggested Repository Structure

```text
tokenpilot/
├── apps/
│   └── desktop/
│       ├── src/                 # React UI
│       └── src-tauri/           # Tauri/Rust host
│
├── crates/
│   ├── core/
│   ├── sandbox/
│   ├── process/
│   ├── security/
│   └── audit/
│
├── packages/
│   ├── contracts/
│   ├── quota/
│   ├── jobs/
│   ├── browser/
│   ├── provider-adapters/
│   └── ui/
│
├── sidecars/
│   └── aiuse-bridge/            # only if necessary
│
├── vendor/
│   └── aiuse-shared-quota-semantics/
│
├── jobs/
│   ├── repo-scout/
│   ├── repo-lab/
│   ├── skill-hunter/
│   ├── skill-lab/
│   ├── website-study/
│   ├── website-recreate/
│   ├── benchmark/
│   └── research/
│
├── sandbox-images/
│
├── docs/
│   ├── architecture/
│   ├── security/
│   ├── provider-adapters/
│   └── decisions/
│
└── tests/
    ├── contracts/
    ├── integration/
    ├── security/
    └── e2e/
```

---

# 62. Job Template Contract

```ts
interface JobTemplate<TConfig> {
  id: JobType
  displayName: string
  describe(config: TConfig): JobPreview
  validate(config: TConfig): ValidationResult
  requiredPermissions(config: TConfig): PermissionSet
  requiredCapabilities(config: TConfig): CapabilityRequirement[]
  buildPlan(config: TConfig): JobPlan
  verify(result: JobExecutionResult): Promise<VerificationResult>
}
```

This keeps job types modular.

---

# 63. Browser Task Contract

```ts
type BrowserTask = {
  purpose: "navigate" | "extract" | "capture" | "verify"
  startUrl: string
  goal: string
  allowedHosts: string[]
  containsSensitiveData: boolean
  requiresScreenshot: boolean
  requiresDom: boolean
}
```

Router pseudocode:

```ts
if (task.containsSensitiveData) {
  return playwright
}

if (task.requiresScreenshot || task.requiresDom) {
  return playwright
}

if (jevEnabled && isPublicWeb(task) && jev.supports(task)) {
  return jev
}

return playwright
```

Complex interpretation happens after deterministic capture.

---

# 64. Testing Strategy

## 64.1 Unit tests

- job validation,
- URL/private-IP rules,
- account mapping,
- state transitions,
- authorization hashing,
- permission diffing,
- export filtering,
- secret redaction,
- quota freshness classification,
- Jev routing policy.

## 64.2 Contract tests

Against vendored `aiuse` fixtures:

- parse snapshots,
- parse suggestion,
- multiple windows,
- shared allotment,
- stale/lapsed account,
- burn,
- on pace,
- conserve,
- collector error.

## 64.3 Sandbox security tests

Must prove:

- cannot read host home directory,
- cannot read `~/.ssh`,
- cannot see unrelated environment secrets,
- cannot access Docker socket,
- cannot bind privileged host resources,
- private/LAN endpoints blocked for public-web job,
- cleanup removes credential material.

## 64.4 State-machine tests

Explicitly test illegal transitions:

```text
DRAFT → RUNNING               FAIL
AWAITING_CONFIRMATION → RUNNING FAIL
AUTHORIZED → RUNNING before sandbox FAIL
```

## 64.5 Jev tests

Paid API calls are never part of normal unit tests.

Use mocked Jev decisions for:

- CLICK,
- TYPE_TEXT,
- SELECT,
- BLOCKED,
- DONE requiring verification,
- low-confidence fallback.

## 64.6 E2E tests

Safe test fixtures:

- tiny public test repo,
- local mock website inside isolated test network,
- mocked provider runner,
- mocked quota snapshots.

Critical E2E:

```text
dashboard
→ choose Repo Lab
→ configure
→ account
→ security
→ preflight
→ final RUN JOB
→ sandbox
→ fake agent
→ result
→ export
→ cleanup
```

---

# 65. Security Acceptance Tests

Release-blocking:

1. No unconfirmed job can execute.
2. Editing job spec after confirmation invalidates authorization.
3. Editing permissions after confirmation invalidates authorization.
4. Sandbox starts before agent.
5. Host home directory is inaccessible.
6. Host SSH directory is inaccessible.
7. Unknown repo cannot mount Docker socket.
8. Private IP/localhost browser target blocked.
9. Secret env not globally inherited.
10. Export secret scan works.
11. Stop terminates agent/browser processes.
12. Sandbox cleanup removes job credentials.

---

# 66. Product Acceptance Criteria — V1

V1 is complete when:

### Dashboard
- [ ] At least three provider/account types can be displayed through `aiuse`.
- [ ] Multiple accounts under at least one provider render independently.
- [ ] Reset countdown and recommendation display.
- [ ] Collector errors are isolated.
- [ ] Refresh works.
- [ ] Data freshness visible.

### Jobs
- [ ] Repo Scout works.
- [ ] Repo Lab works.
- [ ] Website Study works.
- [ ] Research works.
- [ ] At least one of Skill Hunter / Website Recreate works before public beta.
- [ ] Job templates share the common lifecycle.

### Manual authorization
- [ ] Final RUN JOB screen exists.
- [ ] Nothing executes before authorization.
- [ ] Authorization hash enforced.
- [ ] Execution begins only after sandbox-ready state.

### Security
- [ ] Balanced Sandbox implemented.
- [ ] Host filesystem blocked.
- [ ] Private repo access absent.
- [ ] No browser profile sharing.
- [ ] No Docker socket mount.
- [ ] URL SSRF checks.
- [ ] Secret-safe export.

### Execution
- [ ] At least one provider runner works end-to-end.
- [ ] Second runner works or is clearly marked planned.
- [ ] Pause/Stop supported where runner allows it.
- [ ] Logs/audit visible.

### Cross-platform
- [ ] macOS build.
- [ ] Windows build.
- [ ] Linux build.
- [ ] Unsupported provider integrations degrade gracefully.

### Browser
- [ ] Playwright path works.
- [ ] Jev optional adapter does not block core app.
- [ ] Jev policy forbids sensitive contexts.
- [ ] Final Jev outcomes independently verified.

---

# 67. Performance Targets

These are product targets, not hard external guarantees.

- Dashboard usable within ~2 seconds after cached local load.
- Quota refresh runs asynchronously without freezing UI.
- Account cards update incrementally.
- Local UI actions should feel immediate.
- Sandbox startup target under ~10 seconds when base image is cached.
- Job logs stream incrementally.
- App idle memory should remain materially below a typical Electron implementation.

Do not delay V1 for micro-optimization.

---

# 68. Build Phases

## Phase 0 — Repo/bootstrap

Deliver:

- monorepo,
- Tauri desktop shell,
- React UI,
- SQLite,
- contracts package,
- test harness,
- lint/typecheck/test CI,
- architecture docs.

No provider execution yet.

---

## Phase 1 — Quota dashboard

Deliver:

- `aiuse` doctor integration,
- snapshot parsing,
- suggestion parsing,
- account model,
- account aliases,
- multi-account dashboard,
- freshness states,
- local cache,
- tray top alert.

At end of Phase 1 TokenPilot is already useful as a quota dashboard.

---

## Phase 2 — Manual job lifecycle

Deliver:

- job templates framework,
- job creation,
- account selection,
- security/budget page,
- run preview,
- preflight,
- ExecutionIntent,
- state machine,
- audit events.

Use mocked executor.

This phase must prove **no execution before final RUN**.

---

## Phase 3 — Sandbox

Deliver:

- Docker doctor,
- create/exec/stop/destroy,
- network controls,
- non-root container,
- resource limits,
- job workspace,
- export,
- cleanup,
- security tests.

---

## Phase 4 — First real runner

Pick the most reliable provider CLI first.

Recommended evaluation order:

1. Codex
2. Claude Code
3. OpenCode
4. Antigravity
5. Cursor

Deliver one full:

```text
quota → select job → run → sandbox → agent → result
```

---

## Phase 5 — Repo Scout + Repo Lab

Deliver real useful GitHub workflow.

This is the first "Productive Burn" proof.

Success demo:

> Use an under-used AI account to evaluate a public GitHub project safely.

---

## Phase 6 — Browser layer

Deliver:

- Playwright executor,
- screenshot capture,
- website validation,
- public-web network policy,
- Website Study.

Then add Jev as optional fast path.

Do not start with Jev before deterministic browser path works.

---

## Phase 7 — Jev fast path

Deliver:

- Jev install/doctor,
- API key configuration,
- public-web classifier,
- executor,
- logging,
- deterministic final verification,
- fallback to Playwright.

Measure:

- steps,
- model calls,
- elapsed time,
- fallback rate.

Keep only if it produces real value.

---

## Phase 8 — Skill workflows + Website Recreate

Deliver:

- Skill Hunter,
- Skill Lab,
- Website Recreate,
- visual QA loop,
- result export.

---

## Phase 9 — More runners

Add provider runners only where reliable.

---

# 69. First Build Slice

The first implementation should NOT attempt the whole product.

Build this vertical slice:

```text
Tauri app
  ↓
aiuse snapshot
  ↓
Dashboard
  ↓
Select one account
  ↓
Create mocked Repo Lab job
  ↓
Security page
  ↓
Final RUN JOB
  ↓
ExecutionIntent
  ↓
Mock sandbox
  ↓
Mock job finishes
  ↓
Result screen
```

This proves the UX and authorization architecture before dangerous execution code exists.

Second slice replaces mock sandbox with Docker.

Third slice replaces mock runner with one real CLI adapter.

---

# 70. Recommended Coding-Agent Work Strategy

To save development quota:

## Use Codex/Claude for
- architecture-sensitive changes,
- Rust/Tauri integration,
- security boundaries,
- provider adapters,
- sandbox code,
- tests,
- refactors,
- complex UI state.

## Use deterministic tools for
- formatting,
- schema generation,
- migrations,
- static validation.

## Use Jev only for
- runtime public-browser jobs,
- possibly later for developer research,
- never as the main code-writing model.

## Keep agent context small
Give each implementation task:

- this PRD,
- relevant module,
- acceptance criteria,
- tests to add,
- exact scope.

Do not ask one giant agent session to build V1 end-to-end.

---

# 71. Suggested Development Tickets

## EPIC A — Foundation
- A1 Tauri + React monorepo
- A2 SQLite schema/migrations
- A3 Local settings
- A4 Audit event system
- A5 System doctor

## EPIC B — Quota
- B1 aiuse CLI discovery
- B2 aiuse JSON parser
- B3 aiuse serve adapter
- B4 shared-semantics fixture tests
- B5 account aliases
- B6 dashboard cards
- B7 suggestion banner
- B8 tray alert

## EPIC C — Job lifecycle
- C1 job template contract
- C2 create/configure job
- C3 provider/account selection
- C4 security profile
- C5 preflight
- C6 ExecutionIntent
- C7 state machine
- C8 run console
- C9 pause/stop
- C10 result page

## EPIC D — Sandbox
- D1 Docker doctor
- D2 sandbox create/destroy
- D3 process execution
- D4 network restrictions
- D5 secret injection
- D6 export filtering
- D7 security tests

## EPIC E — Agent runners
- E1 runner interface
- E2 Codex adapter
- E3 Claude adapter
- E4 OpenCode adapter
- E5 Antigravity investigation/adapter
- E6 Cursor capability probe

## EPIC F — Jobs
- F1 Repo Scout
- F2 Repo Lab
- F3 Research
- F4 Website Study
- F5 Skill Hunter
- F6 Skill Lab
- F7 Website Recreate
- F8 Benchmark

## EPIC G — Browser
- G1 Playwright executor
- G2 browser isolation
- G3 screenshot/DOM evidence
- G4 Jev doctor
- G5 Jev executor
- G6 Jev safety classifier
- G7 verification/fallback

---

# 72. Definition of Done for Every Ticket

A ticket is not complete unless:

- code is implemented,
- tests pass,
- typecheck passes,
- lint passes,
- errors are surfaced to UI,
- audit behavior considered,
- security permissions reviewed,
- documentation updated,
- no unrelated refactor,
- no hidden automatic execution introduced.

For security-sensitive tickets add explicit adversarial tests.

---

# 73. Threat Model

## Threat T1 — Malicious repo install script
Mitigation:
sandbox, no host mounts, no Docker socket, limited network.

## T2 — Prompt injection in README/SKILL.md
Mitigation:
downloaded instructions do not override TokenPilot policy; agent tools remain constrained.

## T3 — Website tries to access localhost/private network
Mitigation:
URL resolution checks and network policy.

## T4 — Agent tries to read secrets
Mitigation:
secret not mounted; environment allowlist.

## T5 — Provider account mix-up
Mitigation:
stable account ID + visible final confirmation + adapter-level account check.

## T6 — Stale quota causes bad recommendation
Mitigation:
freshness display and pre-run refresh.

## T7 — Upstream `aiuse` schema changes
Mitigation:
versioned contract parser + fixtures + raw capture + graceful failure.

## T8 — Jev leaks sensitive page state
Mitigation:
public-web-only policy and explicit classifier before invocation.

## T9 — Export leaks generated `.env`
Mitigation:
manifest allowlist + secret scan + hidden-file policy.

## T10 — Job changes after confirmation
Mitigation:
hash-bound ExecutionIntent.

---

# 74. Upstream Dependency Risks

## `aiuse`
Risk:
collector availability differs by OS/provider.

Mitigation:
adapter boundary, doctor screen, track-only state, fallback CLI mode.

## Jev
Risk:
external API dependency, privacy, rapidly evolving interface.

Mitigation:
optional feature, Playwright fallback, public-only, pin tested version.

## Docker
Risk:
not installed/running, Windows complexity.

Mitigation:
doctor, setup guidance, future Podman adapter.

## Provider CLIs
Risk:
auth and command interfaces change.

Mitigation:
one adapter per provider, integration tests, capability flags.

---

# 75. Licensing Requirement

Before copying source or vendoring upstream material:

- record project license,
- retain required notices,
- distinguish "call as external dependency" from "copy source",
- do not blindly copy code from repositories with incompatible/unclear licensing.

`aiuse` is currently presented as MIT-licensed upstream, but build automation must record the exact upstream version/license used.

Jev dependency/license should similarly be pinned and recorded before redistribution.

---

# 76. Future V1.1 / V2 Backlog

Not required to start building:

- ccusage/local token history,
- per-project token attribution,
- cost analytics,
- historical burn charts,
- model routing suggestions,
- private repo opt-in mode,
- user-whitelisted real-project mode,
- LAN-only multi-machine aggregation,
- encrypted sync,
- mobile companion,
- plugin/skill marketplace,
- scheduled reminders,
- account rotation helpers,
- richer visual diff metrics,
- local LLM fallback,
- MCP interface,
- job recipe sharing,
- provider-specific overage controls.

Automatic execution remains out of scope unless product direction explicitly changes.

---

# 77. Product Copy

Primary CTA:

**USE MY CREDIT**

Recommended account card:

```text
🔥 USE SOON

Antigravity — Personal 3
78% remaining
Resets in 18h

You are behind pace for this quota window.
```

Final authorization:

**RUN JOB**

Pre-run safety statement:

```text
Nothing has executed yet.
```

Sandbox statement:

```text
Unknown code may execute inside an isolated sandbox.
It cannot access your normal files or private repositories.
```

Jev disclosure when applicable:

```text
Fast public-web navigation is enabled for this job.
Public page state may be sent to the configured Jev/TypeSafe service.
No private or authenticated page will be routed through Jev.
```

---

# 78. Decision Log

The following product decisions are locked for V1:

1. **Hybrid desktop app**
   - tray/menu-bar + full local dashboard.

2. **Cross-platform**
   - macOS + Windows + Linux from V1 architecture.

3. **Single-machine installations**
   - no sync.

4. **Local credentials allowed**
   - use existing provider/CLI auth;
   - no TokenPilot cloud credential store.

5. **No inference proxy**
   - TokenPilot does not sit between normal coding sessions and provider.

6. **Track all; execute selectively**
   - monitor providers even if execution adapter is unavailable.

7. **Manual execution only**
   - no automatic quota burn.

8. **Balanced sandbox**
   - unknown code allowed only in isolated disposable environment.

9. **Use `aiuse`, do not fork it**
   - quota engine is upstream dependency/adapter.

10. **Jev optional**
    - public-web navigation fast path only.

11. **Playwright primary deterministic browser**
    - screenshots/DOM/verification.

12. **No private repos in V1**

13. **No host-project modification in V1**

14. **No paid overage automatically**

---

# 79. Source/Dependency Notes Verified for This PRD

## aiuse
Repository:
https://github.com/djbclark/aiuse

Relevant current upstream capabilities include:

- JSON output,
- `suggest --json`,
- loopback `serve`,
- stable JSON contract documentation,
- shared language-neutral quota semantics,
- pace settings,
- shared-allotment handling,
- lapsed-account handling,
- concurrent collectors.

TokenPilot should integrate through a stable adapter and version its expectations.

## Jev Ultrafast
Repository:
https://github.com/browser-use/jev-ultrafast

Relevant current upstream behavior:

- indexed browser action space,
- operations such as click/type/select/scroll/wait/done/blocked,
- TypeSafe decision request,
- optional small LLM for text entry,
- screenshots are not the normal decision input,
- final outcome must be independently verified,
- current implementation sends structured page state to the configured TypeSafe endpoint.

This is why TokenPilot limits Jev to public-web tasks.

---

# 80. Recommended First Command to Give a Coding Agent

Use the following instruction with Codex/Claude after creating a new repository:

```text
Read PRD.md completely before making changes.

We are building TokenPilot. Do not attempt the full product in one pass.

Implement Phase 0 and the first vertical slice only:

1. Create a Tauri + React + TypeScript desktop application.
2. Create the proposed monorepo/module structure where it is useful, but avoid empty abstraction layers.
3. Add SQLite with migrations for providers, accounts, jobs, execution_intents, and audit events.
4. Create typed contracts for Account, QuotaSnapshot, Job, ExecutionIntent, and AuditEvent.
5. Implement a mocked QuotaSource returning multiple providers/accounts.
6. Build the Dashboard showing quota cards and the "USE MY CREDIT" CTA.
7. Implement a mocked Repo Lab job wizard:
   Choose Job → Configure → Account → Security/Budget → Review.
8. Implement preflight as non-executing checks.
9. Implement the final "RUN JOB" confirmation.
10. Pressing RUN JOB must persist a hash-bound ExecutionIntent.
11. Implement a mock sandbox/runner that transitions:
    AUTHORIZED → PREPARING_SANDBOX → SANDBOX_READY → RUNNING → COMPLETED.
12. Ensure there is no code path from AWAITING_CONFIRMATION directly to RUNNING.
13. Add tests for legal and illegal state transitions and authorization invalidation.
14. Build a simple Result screen.

Do NOT integrate real Claude/Codex execution yet.
Do NOT run downloaded repositories yet.
Do NOT add cloud sync.
Do NOT add automatic execution.
Do NOT add Jev yet.

Before finishing, run all tests/typecheck/lint/build and report the exact commands and results.
```

---

# 81. Final Product Definition

TokenPilot V1 succeeds if the user can open one local app and do this:

```text
See every supported AI account
        ↓
Understand which quota is likely to be wasted
        ↓
Press USE MY CREDIT
        ↓
Choose a useful job
        ↓
Choose provider/account
        ↓
Review security and budget
        ↓
Press RUN JOB
        ↓
TokenPilot establishes a safe sandbox
        ↓
Selected AI account performs useful work
        ↓
User receives auditable results
        ↓
User decides whether to export or delete them
```

The product must preserve one invariant above all others:

> **TokenPilot may recommend automatically, but it may execute only after explicit user authorization.**
