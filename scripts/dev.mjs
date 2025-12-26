import { spawn } from "node:child_process";
import fs from "node:fs";

function fileExists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function readText(p) { try { return fs.readFileSync(p, "utf8"); } catch { return ""; } }
function pyBin() { return process.platform === "win32" ? "python" : "python3"; }

function shouldUseUvicorn(serverPyText) {
  const hasFastApi = /FastAPI/.test(serverPyText) && /app\s*=\s*FastAPI\s*\(/.test(serverPyText);
  const hasMain = /if\s+__name__\s*==\s*["']__main__["']\s*:/.test(serverPyText);
  return hasFastApi && !hasMain;
}

function ensureTruncatedFile(p) {
  try {
    fs.writeFileSync(p, "");
  } catch {
    // If we can't write logs, still run dev servers.
  }
}

function teeChildOutput(child, logPath) {
  const logStream = (() => {
    try {
      return fs.createWriteStream(logPath, { flags: "a" });
    } catch {
      return null;
    }
  })();

  const writeLog = (chunk) => {
    if (!logStream) return;
    try { logStream.write(chunk); } catch {}
  };

  if (child.stdout) {
    child.stdout.on("data", (chunk) => {
      try { process.stdout.write(chunk); } catch {}
      writeLog(chunk);
    });
  }
  if (child.stderr) {
    child.stderr.on("data", (chunk) => {
      try { process.stderr.write(chunk); } catch {}
      writeLog(chunk);
    });
  }

  child.on("close", (code) => {
    const line = `\n[dev.mjs] process exited with code ${code}\n`;
    try { process.stderr.write(line); } catch {}
    writeLog(line);
    try { logStream?.end(); } catch {}
  });
}

function runTee(cmd, args, logPath, opts = {}) {
  const child = spawn(cmd, args, { stdio: ["inherit", "pipe", "pipe"], ...opts });
  teeChildOutput(child, logPath);
  return child;
}

async function main() {
  const children = [];
  const backendLog = "/tmp/cbp_backend.log";
  const frontendLog = "/tmp/cbp_frontend.log";

  // Ensure log files exist and start clean for this session.
  ensureTruncatedFile(backendLog);
  ensureTruncatedFile(frontendLog);

  const frontendUrl = "http://127.0.0.1:5173";
  const backendUrl = "http://127.0.0.1:8000";
  const docsUrl = "http://127.0.0.1:8000/docs";

  // backend
  if (fileExists("server.py")) {
    const t = readText("server.py");
    const py = pyBin();
    if (shouldUseUvicorn(t)) {
      children.push(runTee(py, ["-m", "uvicorn", "server:app", "--reload", "--host", "0.0.0.0", "--port", "8000"], backendLog));
    } else {
      children.push(runTee(py, ["server.py"], backendLog));
    }
  }

  // frontend
  const frontendDir = "web/dashboard-react";
  if (fileExists(`${frontendDir}/package.json`)) {
    if (!fileExists(`${frontendDir}/node_modules`)) {
      const i = spawn("npm", ["--prefix", frontendDir, "install"], { stdio: "inherit" });
      const code = await new Promise((res) => i.on("close", res));
      if (code !== 0) process.exit(code);
    }
    // Force predictable port/host so dev:clean guarantees URLs.
    children.push(
      runTee(
        "npm",
        ["--prefix", frontendDir, "run", "dev", "--", "--host", "127.0.0.1", "--port", "5173", "--strictPort"],
        frontendLog
      )
    );
  }

  // Always print URLs + log locations for one-touch UX.
  try {
    process.stdout.write("\n");
    process.stdout.write("────────────────────────────────────────\n");
    process.stdout.write("  CryptoBot Pro Dev Environment\n");
    process.stdout.write("────────────────────────────────────────\n");
    process.stdout.write(`  Frontend:  ${frontendUrl}\n`);
    process.stdout.write(`  Backend:   ${backendUrl}\n`);
    process.stdout.write(`  API Docs:  ${docsUrl}\n`);
    process.stdout.write("────────────────────────────────────────\n");
    process.stdout.write(`  Logs (follow): npm run logs:dev\n`);
    process.stdout.write(`  Backend log:   ${backendLog}\n`);
    process.stdout.write(`  Frontend log:  ${frontendLog}\n`);
    process.stdout.write("────────────────────────────────────────\n");
    process.stdout.write("\n");
  } catch {}

  // macOS best-effort: open browser unless NO_OPEN=1
  try {
    const noOpen = String(process.env.NO_OPEN || "").trim() === "1";
    if (!noOpen && process.platform === "darwin") {
      const opener = spawn("open", [frontendUrl], { stdio: "ignore" });
      opener.on("error", () => {});
    }
  } catch {}

  const stop = () => children.forEach((c) => { try { c.kill("SIGINT"); } catch {} });
  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("SIGTERM", () => { stop(); process.exit(0); });

  const codes = await Promise.all(children.map(c => new Promise(res => c.on("close", res))));
  const bad = codes.find(c => c !== 0);
  process.exit(bad ?? 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
