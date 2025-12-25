import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function runNodeRun(required, bin, binArgs) {
  const args = ["scripts/run.mjs"];
  if (required) args.push("--required");
  args.push(bin, ...binArgs);
  const res = spawnSync(process.execPath, args, { stdio: "inherit" });
  return res.status ?? 1;
}

let code = 0;

console.log("verify: start");

if (existsSync("tsconfig.json")) {
  console.log("verify: typecheck");
  code ||= runNodeRun(false, "tsc", ["-p", "tsconfig.json", "--noEmit"]);
} else {
  console.log("verify: typecheck SKIP (no tsconfig.json)");
}

console.log("verify: lint");
code ||= runNodeRun(false, "eslint", [".", "--max-warnings=0"]);

console.log("verify: test");
code ||= runNodeRun(false, "vitest", ["run"]);

console.log("verify: build");
code ||= runNodeRun(true, "vite", ["build"]);

if (code === 0) console.log("verify: OK");
else console.log("verify: FAIL");

process.exit(code);
