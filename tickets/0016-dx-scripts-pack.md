# Ticket 0016 — DX Scripts Pack (Near-Zero Terminal Work)
Status: READY
Owner: Project Steward
Priority: P0
Scope: root `package.json` + `scripts/*.mjs` (+ optional scripts README)

---

## Goal

Implement a “DX Scripts Pack” so a contributor can do near-zero terminal work:
- `npm run dev:clean` to start everything reliably (no port conflicts) and see logs
- `npm run verify:ci` to run CI-parity verification
- `npm run pr:auto` to open/update PR and enable auto-merge (squash + delete branch)

Hard safety constraints:
- No `rm -rf`
- No `sudo`
- No `curl|bash`
- No backend/Python code changes

---

## Repo Context (existing entrypoints)

Root scripts already exist:

```1:15:package.json
{
  "name": "cryptobot-19-clean",
  "private": true,
  "scripts": {
    "dev": "node scripts/dev.mjs",
    "verify": "node scripts/verify-root.mjs",
    "запуск": "npm run dev",
    "проверка": "npm run verify",
    "run": "npm run dev",
    "check": "npm run verify",
    "start": "npm run dev",
    "test": "npm run verify",
    "s": "npm run dev",
    "v": "npm run verify"
  }
}
```

Root dev runner exists:

```1:53:scripts/dev.mjs
import { spawn } from "node:child_process";
import fs from "node:fs";
// ...
  // backend
  if (fileExists("server.py")) {
    const t = readText("server.py");
    const py = pyBin();
    if (shouldUseUvicorn(t)) {
      children.push(run(py, ["-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8000"]));
    } else {
      children.push(run(py, ["server.py"]));
    }
  }
// ...
  // frontend
  const frontendDir = "web/dashboard-react";
  if (fileExists(`${frontendDir}/package.json`)) {
    if (!fileExists(`${frontendDir}/node_modules`)) {
      const i = run("npm", ["--prefix", frontendDir, "install"]);
// ...
    children.push(run("npm", ["--prefix", frontendDir, "run", "dev"]));
  }
```

Root verify runner exists and is the canonical entrypoint:

```48:89:scripts/verify-root.mjs
async function main() {
  const frontendDir = "web/dashboard-react";
  const pkgPath = `${frontendDir}/package.json`;
  // frontend
  if (fileExists(pkgPath)) {
    if (!fileExists(`${frontendDir}/node_modules`)) {
      await run("npm", ["--prefix", frontendDir, "install"]);
    }
    // ... lint/test/build ...
  }
  // backend ruff/pytest (if present)
}
```

---

## In Scope

### 1) Update root `package.json` scripts

Add/Update exactly these scripts:
- `dev` (keep canonical): `node scripts/dev.mjs`
- `dev:clean`: frees ports 5173/8000, starts dev, prints URLs, tails logs
- `ports:free`: frees 5173/8000 (TERM then KILL) + prints remaining listeners
- `verify` (keep canonical): `node scripts/verify-root.mjs`
- `verify:ci`: alias to `verify` (CI parity)
- `pr:auto`: create/update PR for current branch and enable auto-merge (squash + delete branch)
- `logs:dev`: tail the correct dev logs (must align with what dev uses)

### 2) Add new Node scripts (safe, predictable)

Create:
- `scripts/ports-free.mjs`
- `scripts/pr-auto.mjs`
- `scripts/logs-dev.mjs`

### 3) Update `scripts/dev.mjs` (required for `logs:dev`)

`logs:dev` must tail the same log files that dev produces.
Today `scripts/dev.mjs` streams to terminal only (no file logs). Modify it to:
- Write backend logs to `/tmp/cbp_backend.log`
- Write frontend logs to `/tmp/cbp_frontend.log`
- Still show live logs in terminal (tee behavior)
- Print URLs consistently:
  - Frontend: `http://127.0.0.1:5173`
  - Backend: `http://127.0.0.1:8000`
  - API Docs: `http://127.0.0.1:8000/docs`

---

## Out of Scope (do NOT touch)

- Any Python files (backend logic, server behavior)
- Any non-`.mjs` scripts (no `.sh` changes)
- Any `web/dashboard-react/*` code
- Dependency version changes
- CI config changes (no `.github` directory present)

---

## Script Requirements (Acceptance)

### A) `npm run ports:free`
- [ ] Kills listeners on ports **5173** and **8000** using SIGTERM then SIGKILL if needed
- [ ] Prints port status before/after
- [ ] Prints remaining listeners (at least those ports; may also print common dev ports)
- [ ] Safe: never kills processes except those *listening on those ports*

### B) `npm run dev:clean`
- [ ] Runs `ports:free` first, then starts `scripts/dev.mjs`
- [ ] Starts without “Port 5173/8000 already in use”
- [ ] Prints URLs clearly
- [ ] Shows live logs in terminal
- [ ] Writes log files so `logs:dev` can tail them

### C) `npm run verify:ci`
- [ ] Exactly equals `npm run verify` (alias)
- [ ] Explains (in output) what it covers (frontend lint/build; backend ruff/pytest if present)

### D) `npm run pr:auto`
- [ ] Works from current branch (no checkout tricks; should not assume `main`)
- [ ] Works even when local worktrees exist
- [ ] Creates PR if missing, otherwise updates existing PR
- [ ] Enables auto-merge **squash**
- [ ] Requests delete-branch-on-merge (best effort; do not change repo-wide settings)
- [ ] Uses `gh api` for auto-merge enablement (GraphQL) with safe fallback if needed
- [ ] Fails with clear instructions if `gh` is missing or not authenticated

### E) `npm run logs:dev`
- [ ] Tails the same log files that `dev.mjs` writes
- [ ] Shows last N lines then follows
- [ ] Clear message if logs aren’t present yet (“Run dev:clean first”)

### F) CI gate
- [ ] `npm run -s verify` passes after changes

---

## Failure Modes (must be human-friendly)

- `lsof` missing → ports:free prints warning and continues (no crash)
- permission denied killing PID → prints warning and continues
- `gh` missing → prints install hint and exits 1
- `gh auth` missing → prints `gh auth login` hint and exits 1
- detached HEAD or on `main/master` → pr:auto refuses with actionable message
- no logs found → logs:dev prints expected paths and how to create them

---

## Files to Edit (max 5)

1) `package.json` (root) — add scripts
2) `scripts/dev.mjs` — add file logs + URL print
3) `scripts/ports-free.mjs` — new
4) `scripts/pr-auto.mjs` — new
5) `scripts/logs-dev.mjs` — new

Optional (only if needed):
- `scripts/README.md` — brief usage (1-minute flow)

---

## Verification Commands

```sh
npm run ports:free
npm run dev:clean
npm run logs:dev
npm run verify:ci
npm run -s verify
```


