# TokenPilot

> **Local-first AI Subscription Command Center & Safe Manual R&D Execution Engine**

TokenPilot monitors multiple AI coding subscriptions and accounts (Google Antigravity, Anthropic Claude Code, OpenAI Codex, Cursor) and turns under-used quota into productive R&D work before quota expires—**without ever executing code automatically**.

---

## Key Invariants (PRD v1.0)

1. **Human Authorization Boundary**: No job executes without an explicit final **RUN JOB** confirmation.
2. **Immutable Authorization Hashing**: Pressing RUN JOB persists an `ExecutionIntent` with SHA-256 hashes of the canonical job spec and permissions. Modifying the job or permissions invalidates authorization immediately.
3. **Balanced Sandbox Isolation**: Unknown code runs exclusively inside disposable containers with dropped root privileges, resource caps, and zero host directory mounts (`$HOME` and `~/.ssh` strictly forbidden).
4. **Local-First & Direct**: No cloud account, no TokenPilot inference proxy, loopback-only communication.

---

## Monorepo Architecture

```text
tokenpilot/
├── apps/
│   └── desktop/                 # React 19 + TypeScript + Vite + Tailwind CSS + Tauri v2 Host
│       ├── src/
│       │   ├── components/      # Navbar, TopAlertBanner, QuotaCard
│       │   ├── pages/           # Dashboard, JobWizard, JobConsole, JobResult, Doctor, AuditLog
│       │   └── state/           # Reactive client service
│       └── src-tauri/           # Tauri desktop configuration & Rust host
├── packages/
│   ├── contracts/               # Shared TypeScript schemas & types (Provider, Quota, Job, Sandbox)
│   ├── core/                    # SQLite database, migrations, state machine, canonical hashing, audit log
│   ├── quota/                   # Quota source interfaces, mock multi-account provider, freshness & urgency
│   ├── sandbox/                 # Sandbox provider contract & mock disposable sandbox lifecycle
│   └── jobs/                    # JobTemplate contracts, Repo Lab job definition & preflight checks
└── tests/                       # Automated tests (State machine invariants, authorization tamper invalidation, preflight)
```

---

## Getting Started

### Prerequisites
- Node.js >= 20 (Tested on Node.js v26.8.1 with native `node:sqlite` and `node:test`)
- npm >= 10

### Installation & Build
```bash
# Install dependencies
npm install

# Build all monorepo packages and desktop app
npm run build

# Run automated tests
npm test

# Run TypeScript typechecks
npm run typecheck

# Start local desktop development server
npm run dev

# Generate / update codebase Knowledge Graph (Graphify)
npm run graphify

# Query codebase knowledge graph
npm run graphify:query -- "how does the quota provider work?"
```

---

## Codebase Knowledge Graph (Graphify)

TokenPilot includes a native [Graphify](https://github.com/Graphify-Labs/graphify) integration:
- `.agents/rules/graphify.md`: Always-on rules for AI agents to query the graph rather than grepping flat files.
- `.agents/skills/graphify/`: Antigravity/Agent skill enabling `/graphify` queries and shortest-path lookups.
- `graphify-out/`: Generated interactive knowledge graph (`graph.html`), JSON GraphRAG dataset (`graph.json`), and architecture report (`GRAPH_REPORT.md`).

Commands:
- `npm run graphify`: Re-extract AST & rebuild community clustering.
- `npm run graphify:update`: Incremental update for modified files.
- `npm run graphify:query -- "<question>"`: Scoped BFS/DFS graph search.

---

## Automated Verification Suite

- **State Machine Invariants**: Proves that illegal transitions (e.g. `AWAITING_CONFIRMATION -> RUNNING` and `DRAFT -> RUNNING`) throw `InvalidStateTransitionError`.
- **Authorization Hashing**: Proves deterministic canonical JSON hashing and verifies that tampering with a job after authorization invalidates the intent.
- **SSRF & Sandbox Security**: Verifies rejection of localhost/private IP targets and host directory mount attempts.
- **Quota Intelligence**: Verifies multi-account freshness calculation and behind-pace urgency detection.
