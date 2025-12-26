#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const TARGET_PORTS = [5173, 8000];
const SCAN_PORTS = [3000, 5173, 8000, 8080];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasCmd(cmd) {
  const res = spawnSync(cmd, ["-v"], { stdio: "ignore" });
  if (res.error && res.error.code === "ENOENT") return false;
  return res.status === 0 || res.status === 1;
}

function lsofPids(port) {
  // lsof returns exit code 1 when no matches; treat as empty.
  const res = spawnSync("lsof", ["-ti", `tcp:${port}`], { encoding: "utf8" });
  if (res.error) return [];
  const out = (res.stdout || "").trim();
  if (!out) return [];
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function printListeners(port) {
  const res = spawnSync(
    "lsof",
    ["-nP", `-iTCP:${port}`, "-sTCP:LISTEN"],
    { encoding: "utf8" }
  );
  const out = (res.stdout || "").trim();
  if (!out) {
    console.log(`  Port ${port}: (no listeners)`);
    return;
  }
  console.log(`  Port ${port} listeners:`);
  out.split("\n").forEach((line) => console.log(`    ${line}`));
}

function tryKill(pid, signal) {
  try {
    process.kill(pid, signal);
    return { ok: true };
  } catch (e) {
    return { ok: false, err: e };
  }
}

async function freePort(port) {
  console.log(`[ports:free] Checking port ${port}...`);
  let pids = lsofPids(port);
  if (pids.length === 0) {
    console.log(`[ports:free] Port ${port} free`);
    return;
  }

  console.log(`[ports:free] Port ${port} in use by PIDs: ${pids.join(", ")}`);

  // SIGTERM first
  for (const pid of pids) {
    const r = tryKill(pid, "SIGTERM");
    if (r.ok) console.log(`[ports:free] Sent SIGTERM to PID ${pid}`);
    else console.log(`[ports:free] WARN: Could not SIGTERM PID ${pid}: ${r.err?.message || r.err}`);
  }

  await sleep(2000);

  // Re-check, SIGKILL if still listening
  pids = lsofPids(port);
  if (pids.length === 0) {
    console.log(`[ports:free] Port ${port} free (after SIGTERM)`);
    return;
  }

  console.log(`[ports:free] Port ${port} still in use, escalating to SIGKILL: ${pids.join(", ")}`);
  for (const pid of pids) {
    const r = tryKill(pid, "SIGKILL");
    if (r.ok) console.log(`[ports:free] Sent SIGKILL to PID ${pid}`);
    else console.log(`[ports:free] WARN: Could not SIGKILL PID ${pid}: ${r.err?.message || r.err}`);
  }

  await sleep(500);

  pids = lsofPids(port);
  if (pids.length === 0) {
    console.log(`[ports:free] Port ${port} free`);
  } else {
    console.log(`[ports:free] WARNING: Port ${port} still occupied by PIDs: ${pids.join(", ")}`);
  }
}

async function main() {
  if (process.platform === "win32") {
    console.log("[ports:free] Windows detected: lsof not available. Skipping port free.");
    console.log("[ports:free] Done");
    return;
  }

  if (!hasCmd("lsof")) {
    console.log("[ports:free] WARN: 'lsof' not found. Skipping port free.");
    console.log("[ports:free] Done");
    return;
  }

  for (const port of TARGET_PORTS) {
    await freePort(port);
  }

  console.log("[ports:free] Remaining listeners (scan):");
  for (const port of SCAN_PORTS) {
    printListeners(port);
  }
  console.log("[ports:free] Done");
}

main().catch((e) => {
  console.error("[ports:free] ERROR:", e?.message || e);
  process.exit(1);
});


