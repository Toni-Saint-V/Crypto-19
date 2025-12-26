#!/usr/bin/env node
import fs from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const LOG_FILES = ["/tmp/cbp_backend.log", "/tmp/cbp_frontend.log"];

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function tailAvailable() {
  const res = spawnSync("tail", ["-n", "1", "/dev/null"], { stdio: "ignore" });
  if (res.error && res.error.code === "ENOENT") return false;
  return res.status === 0 || res.status === 1;
}

function printLastLines(path, n = 120) {
  try {
    const txt = fs.readFileSync(path, "utf8");
    const lines = txt.split(/\r?\n/);
    const tail = lines.slice(Math.max(0, lines.length - n)).join("\n");
    process.stdout.write(`==> ${path} (last ${n}) <==\n`);
    process.stdout.write(tail + (tail.endsWith("\n") ? "" : "\n"));
  } catch (e) {
    process.stdout.write(`==> ${path} <==\n`);
    process.stdout.write(`(unable to read: ${e?.message || e})\n`);
  }
}

function startPollingTail(paths) {
  // Minimal cross-platform follow: poll for file growth and print appended bytes.
  const state = new Map();
  for (const p of paths) {
    try {
      const st = fs.statSync(p);
      state.set(p, { pos: st.size });
    } catch {
      state.set(p, { pos: 0 });
    }
  }

  const interval = setInterval(() => {
    for (const p of paths) {
      try {
        const st = fs.statSync(p);
        const prev = state.get(p) || { pos: 0 };

        // Handle truncation/rotation.
        if (st.size < prev.pos) prev.pos = 0;

        if (st.size > prev.pos) {
          const fd = fs.openSync(p, "r");
          const len = st.size - prev.pos;
          const buf = Buffer.alloc(len);
          fs.readSync(fd, buf, 0, len, prev.pos);
          fs.closeSync(fd);
          process.stdout.write(buf.toString("utf8"));
          prev.pos = st.size;
          state.set(p, prev);
        }
      } catch {
        // Ignore missing files mid-stream.
      }
    }
  }, 500);

  const stop = () => {
    clearInterval(interval);
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

async function main() {
  const present = LOG_FILES.filter(exists);
  if (present.length === 0) {
    console.log("[logs:dev] No dev logs found.");
    console.log("[logs:dev] Expected:");
    for (const p of LOG_FILES) console.log(`  ${p}`);
    console.log("[logs:dev] Run: npm run dev:clean");
    return;
  }

  console.log("[logs:dev] Tailing logs:");
  present.forEach((p) => console.log(`  ${p}`));
  console.log("[logs:dev] Press Ctrl+C to stop.\n");

  // Show a short history first.
  for (const p of present) {
    printLastLines(p, 120);
    process.stdout.write("\n");
  }

  // Prefer system tail if available; fallback to polling tail.
  if (tailAvailable()) {
    const tail = spawn("tail", ["-n", "0", "-f", ...present], {
      stdio: ["ignore", "inherit", "inherit"],
    });
    tail.on("close", (code) => process.exit(code ?? 0));
    process.on("SIGINT", () => tail.kill("SIGINT"));
    process.on("SIGTERM", () => tail.kill("SIGTERM"));
  } else {
    console.log("[logs:dev] WARN: 'tail' not available. Falling back to polling.");
    startPollingTail(present);
  }
}

main().catch((e) => {
  console.error("[logs:dev] ERROR:", e?.message || e);
  process.exit(1);
});


