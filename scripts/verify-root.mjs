import { spawn } from "node:child_process";
import fs from "node:fs";

function fileExists(p) { try { fs.accessSync(p); return true; } catch { return false; } }
function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit", ...opts });
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(" ")} -> ${code}`))));
  });
}

function hasEslintConfig(frontendDir) {
  const candidates = [
    `${frontendDir}/eslint.config.js`,
    `${frontendDir}/eslint.config.mjs`,
    `${frontendDir}/eslint.config.cjs`,
    `${frontendDir}/.eslintrc`,
    `${frontendDir}/.eslintrc.js`,
    `${frontendDir}/.eslintrc.cjs`,
    `${frontendDir}/.eslintrc.json`,
    `${frontendDir}/.eslintrc.yaml`,
    `${frontendDir}/.eslintrc.yml`,
  ];
  if (candidates.some(fileExists)) return true;

  const pkgPath = `${frontendDir}/package.json`;
  if (fileExists(pkgPath)) {
    try {
      const pkg = readJson(pkgPath);
      if (pkg.eslintConfig) return true;
    } catch {}
  }
  return false;
}

async function canPy(mod) {
  const py = process.platform === "win32" ? "python" : "python3";
  try {
    await run(py, ["-m", mod, "--version"], { stdio: "ignore" });
    return { ok: true, py };
  } catch {
    return { ok: false, py };
  }
}

async function main() {
  const frontendDir = "web/dashboard-react";
  const pkgPath = `${frontendDir}/package.json`;

  // frontend
  if (fileExists(pkgPath)) {
    if (!fileExists(`${frontendDir}/node_modules`)) {
      await run("npm", ["--prefix", frontendDir, "install"]);
    }
    const pkg = readJson(pkgPath);
    const s = pkg.scripts || {};

    if (s.verify) {
      await run("npm", ["--prefix", frontendDir, "run", "verify"]);
    } else {
      const lintOk = hasEslintConfig(frontendDir);
      if (s.lint) {
        if (lintOk) await run("npm", ["--prefix", frontendDir, "run", "lint"]);
        else console.log("frontend lint skipped: no ESLint config found in web/dashboard-react");
      }
      if (s.test) await run("npm", ["--prefix", frontendDir, "run", "test"]);
      if (s.build) await run("npm", ["--prefix", frontendDir, "run", "build"]);
    }
  } else {
    console.log("frontend verify skipped: web/dashboard-react/package.json not found");
  }

  // backend (если есть чем проверять)
  const hasBackend = fileExists("server.py") || fileExists("pyproject.toml") || fileExists("requirements.txt");
  if (hasBackend) {
    const ruff = await canPy("ruff");
    if (ruff.ok) await run(ruff.py, ["-m", "ruff", "check", "."]);
    const hasTests = fileExists("tests") || fileExists("test");
    if (hasTests) {
      const pytest = await canPy("pytest");
      if (pytest.ok) await run(pytest.py, ["-m", "pytest", "-q"]);
    }
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
