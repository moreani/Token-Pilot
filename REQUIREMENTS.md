# TokenPilot — System Requirements & Cross-Platform Setup Guide

TokenPilot is built with a cross-platform foundation supporting **Windows**, **macOS**, and **Linux**.

---

## 1. Quick Start Prerequisites

### Core Runtime
- **Node.js**: `v20.0.0` or higher (`v20.x` or `v22.x` LTS recommended)
  - Verify: `node -v`
- **npm**: `v10.0.0` or higher
  - Verify: `npm -v`
- **Git**: `v2.30.0` or higher
  - Verify: `git --version`

### Optional (For Native Desktop Tauri Build)
- **Rust**: `v1.75.0` or higher (`rustc --version`, `cargo --version`)
- **Windows**: Microsoft Visual Studio C++ Build Tools with "Desktop development with C++" + WebView2 (pre-installed on Windows 10/11)
- **macOS**: Xcode Command Line Tools (`xcode-select --install`)
- **Linux**: `libwebkit2gtk-4.1-dev`, `build-essential`, `curl`, `wget`, `file`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`

### Optional (For Sandboxed Agent Jobs)
- **Docker Desktop** (or **Podman**) for isolated execution containers.
  - On Windows: Docker Desktop with WSL2 backend.

---

## 2. Setup Guide for Windows

### Step 1: Install Node.js & Git (if not already installed)
Using `winget` in PowerShell (Run as Administrator):
```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
```
*Restart PowerShell after installation.*

### Step 2: Clone the Repository
```powershell
git clone https://github.com/moreani/Token-Pilot.git
cd Token-Pilot
```

### Step 3: Install Project Dependencies
```powershell
npm install
```

### Step 4: Build Monorepo Packages
```powershell
npm run build
```

### Step 5: Run Automated Verification Tests
```powershell
npm test
npm run typecheck
```

### Step 6: Start the Development Server
```powershell
npm run dev
```
TokenPilot dashboard will open at **`http://127.0.0.1:5173/`**.

---

## 3. Quota Telemetry on Windows

TokenPilot scans your local machine to display real usage data without mock datasets:

1. **`tokscale` (Live Quota Provider)**:
   - Included in `devDependencies` and runs automatically via `npx tokscale usage --json`.
   - To install globally (optional):
     ```powershell
     npm install -g tokscale
     ```
2. **Local AI Agent Sessions**:
   - TokenPilot checks standard user configuration directories on Windows:
     - `%USERPROFILE%\.codex` (OpenAI Codex CLI)
     - `%APPDATA%\OpenCode` or `%USERPROFILE%\.config\opencode` (OpenCode)
     - `%USERPROFILE%\.claude\transcripts` (Claude Code)
     - `%USERPROFILE%\.gemini\antigravity` (Google Antigravity)
     - `%APPDATA%\Cursor` (Cursor IDE)

---

## 4. Setup Guide for macOS & Linux

```bash
# Clone
git clone https://github.com/moreani/Token-Pilot.git
cd Token-Pilot

# Install dependencies
npm install

# Build & Test
npm run build
npm test

# Run Dev Server
npm run dev
```

---

## 5. Python Companion Utilities (`requirements.txt`)

If using Python-based AI collectors (e.g., `aiuse` or Playwright headless drivers):

```bash
# Windows (PowerShell)
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
playwright install chromium

# macOS / Linux (bash/zsh)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
```

---

## 6. Monorepo Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server on `http://127.0.0.1:5173/` |
| `npm test` | Runs Node.js native test suite across all packages |
| `npm run typecheck` | Validates TypeScript types across the monorepo |
| `npm run build` | Compiles all packages and Vite assets |
| `npm run lint` | Runs linters across workspaces |

---

## 7. Windows Troubleshooting

- **PowerShell Script Execution Policy**:
  If PowerShell blocks running scripts:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```
- **Port 5173 In Use**:
  If port 5173 is already in use by another application:
  ```powershell
  npm run dev -- --port 5174
  ```
- **Long Paths in Git (Windows)**:
  If Git warns about long path names:
  ```powershell
  git config --system core.longpaths true
  ```
