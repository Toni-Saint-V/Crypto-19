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

function run(cmd, args, opts = {}) {
  const p = spawn(cmd, args, { stdio: "inherit", ...opts });
  return p;
}

async function main() {
  const children = [];

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

  // frontend
  const frontendDir = "web/dashboard-react";
  if (fileExists(`${frontendDir}/package.json`)) {
    if (!fileExists(`${frontendDir}/node_modules`)) {
      const i = run("npm", ["--prefix", frontendDir, "install"]);
      const code = await new Promise((res) => i.on("close", res));
      if (code !== 0) process.exit(code);
    }
    children.push(run("npm", ["--prefix", frontendDir, "run", "dev"]));
  }

  const stop = () => children.forEach((c) => { try { c.kill("SIGINT"); } catch {} });
  process.on("SIGINT", () => { stop(); process.exit(0); });
  process.on("SIGTERM", () => { stop(); process.exit(0); });

  const codes = await Promise.all(children.map(c => new Promise(res => c.on("close", res))));
  const bad = codes.find(c => c !== 0);
  process.exit(bad ?? 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
