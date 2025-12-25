import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const required = args[0] === "--required";
if (required) args.shift();

const bin = args.shift();
if (!bin) {
  console.error("run.mjs: missing bin name");
  process.exit(2);
}

const binName = process.platform === "win32" ? `${bin}.cmd` : bin;
const binPath = path.join(process.cwd(), "node_modules", ".bin", binName);

if (!existsSync(binPath)) {
  const msg = `SKIP: ${bin} not installed (node_modules/.bin/${binName} missing)`;
  console.error(msg);
  process.exit(required ? 1 : 0);
}

const res = spawnSync(binPath, args, { stdio: "inherit" });
process.exit(res.status ?? 1);
