#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isNetworkErrorText(text) {
  const t = String(text || "");
  return /TLS handshake timeout|handshake timeout|timed out|timeout|ECONNRESET|ENOTFOUND|EAI_AGAIN|EOF|Temporary failure|network/i.test(t);
}

function run(cmd, args, opts = {}) {
  const res = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (res.error && res.error.code === "ENOENT") {
    return { ok: false, status: null, stdout: "", stderr: `${cmd} not found` };
  }
  const stdout = (res.stdout || "").toString();
  const stderr = (res.stderr || "").toString();
  return { ok: (res.status ?? 1) === 0, status: res.status ?? 1, stdout, stderr };
}

function execOrFail(cmd, args, failMsg) {
  const r = run(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (!r.ok) {
    const msg = r.stderr.trim() || r.stdout.trim() || `${cmd} failed`;
    console.error(failMsg);
    console.error(msg);
    process.exit(1);
  }
  return r.stdout.trim();
}

function tryExec(cmd, args) {
  const r = run(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
  if (!r.ok) return null;
  return r.stdout.trim();
}

function parseOwnerRepo(remoteUrl) {
  // Supports:
  // - git@github.com:OWNER/REPO.git
  // - https://github.com/OWNER/REPO.git
  // - https://github.com/OWNER/REPO
  const u = (remoteUrl || "").trim();
  if (!u) return null;
  const ssh = u.match(/^git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (ssh) return `${ssh[1]}/${ssh[2]}`;
  const https = u.match(/^https?:\/\/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
  if (https) return `${https[1]}/${https[2]}`;
  return null;
}

function ghAvailable() {
  const r = run("gh", ["--version"], { stdio: "ignore" });
  return r.ok;
}

function ghAuthed() {
  // `gh auth status` returns non-zero if not authed.
  const r = run("gh", ["auth", "status"], { stdio: "ignore" });
  return r.ok;
}

function ghApiJson(args, failPrefix) {
  const r = run("gh", ["api", ...args], { stdio: ["ignore", "pipe", "pipe"] });
  if (!r.ok) {
    console.error(`${failPrefix}`);
    console.error((r.stderr || r.stdout || "").trim());
    process.exit(1);
  }
  try {
    return JSON.parse(r.stdout || "{}");
  } catch (e) {
    console.error(`${failPrefix} (invalid JSON)`);
    console.error(r.stdout);
    process.exit(1);
  }
}

function ghApiGraphql(query, variables, failPrefix) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [k, v] of Object.entries(variables || {})) {
    args.push("-f", `${k}=${v}`);
  }
  const r = run("gh", args, { stdio: ["ignore", "pipe", "pipe"] });
  if (!r.ok) {
    console.error(`${failPrefix}`);
    console.error((r.stderr || r.stdout || "").trim());
    process.exit(1);
  }
  try {
    return JSON.parse(r.stdout || "{}");
  } catch {
    console.error(`${failPrefix} (invalid JSON)`);
    console.error(r.stdout);
    process.exit(1);
  }
}

async function ghApiJsonRetry(args, failPrefix, opts = {}) {
  const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
  const baseDelayMs = Number.isFinite(opts.baseDelayMs) ? opts.baseDelayMs : 600;

  let last = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const r = run("gh", ["api", ...args], { stdio: ["ignore", "pipe", "pipe"] });
    if (r.ok) {
      try {
        return { ok: true, json: JSON.parse(r.stdout || "{}") };
      } catch {
        console.error(`${failPrefix} (invalid JSON)`);
        console.error(r.stdout);
        process.exit(1);
      }
    }

    const msg = (r.stderr || r.stdout || "").trim();
    last = msg;
    const net = isNetworkErrorText(msg);

    if (!net) {
      console.error(`${failPrefix}`);
      console.error(msg);
      process.exit(1);
    }

    if (attempt < retries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`[pr:auto] WARN: GitHub API network error (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
      await sleep(delay);
      continue;
    }
  }

  return { ok: false, networkDown: true, error: last || "GitHub API unavailable" };
}

async function ghApiGraphqlRetry(query, variables, failPrefix, opts = {}) {
  const retries = Number.isFinite(opts.retries) ? opts.retries : 3;
  const baseDelayMs = Number.isFinite(opts.baseDelayMs) ? opts.baseDelayMs : 600;

  let last = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    const args = ["api", "graphql", "-f", `query=${query}`];
    for (const [k, v] of Object.entries(variables || {})) {
      args.push("-f", `${k}=${v}`);
    }
    const r = run("gh", args, { stdio: ["ignore", "pipe", "pipe"] });
    if (r.ok) {
      try {
        return { ok: true, json: JSON.parse(r.stdout || "{}") };
      } catch {
        console.error(`${failPrefix} (invalid JSON)`);
        console.error(r.stdout);
        process.exit(1);
      }
    }

    const msg = (r.stderr || r.stdout || "").trim();
    last = msg;
    const net = isNetworkErrorText(msg);

    if (!net) {
      console.error(`${failPrefix}`);
      console.error(msg);
      process.exit(1);
    }

    if (attempt < retries) {
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`[pr:auto] WARN: GitHub API network error (attempt ${attempt}/${retries}). Retrying in ${delay}ms...`);
      await sleep(delay);
      continue;
    }
  }

  return { ok: false, networkDown: true, error: last || "GitHub API unavailable" };
}

async function main() {
  const offline = String(process.env.PR_AUTO_OFFLINE || "") === "1";
  const noPush = String(process.env.PR_AUTO_NO_PUSH || "") === "1";
  if (!ghAvailable()) {
    console.error("[pr:auto] ERROR: gh CLI not installed.");
    console.error("[pr:auto] Install: https://cli.github.com/");
    process.exit(1);
  }
  if (!ghAuthed()) {
    console.error("[pr:auto] ERROR: gh CLI not authenticated.");
    console.error("[pr:auto] Run: gh auth login");
    process.exit(1);
  }

  // Git sanity
  execOrFail("git", ["rev-parse", "--is-inside-work-tree"], "[pr:auto] ERROR: not a git repository.");
  const branch = execOrFail("git", ["branch", "--show-current"], "[pr:auto] ERROR: unable to determine current branch.");
  if (!branch) {
    console.error("[pr:auto] ERROR: detached HEAD. Checkout a feature branch first.");
    process.exit(1);
  }
  if (branch === "main" || branch === "master") {
    console.error(`[pr:auto] ERROR: refusing to create PR from ${branch}.`);
    console.error("[pr:auto] Checkout a feature branch first.");
    process.exit(1);
  }

  const dirty = tryExec("git", ["status", "--porcelain"]);
  if (!offline && !noPush) {
  if (dirty) {
    console.error("[pr:auto] ERROR: uncommitted changes detected.");
    console.error("[pr:auto] Commit or stash changes first.");
    process.exit(1);
  }
  }

  // Determine repo
  const remoteUrl = execOrFail("git", ["config", "--get", "remote.origin.url"], "[pr:auto] ERROR: missing remote 'origin'.");
  const ownerRepo = parseOwnerRepo(remoteUrl);
  if (!ownerRepo) {
    console.error("[pr:auto] ERROR: could not parse GitHub owner/repo from origin URL.");
    console.error(`[pr:auto] origin: ${remoteUrl}`);
    process.exit(1);
  }
  const [owner] = ownerRepo.split("/");
  const [ownerName, repoName] = ownerRepo.split("/");
  const branchPath = encodeURIComponent(branch).replaceAll("%2F", "/");
  const manualPrUrl = `https://github.com/${ownerName}/${repoName}/pull/new/${branchPath}`;

  console.log(`[pr:auto] Repo:   ${ownerRepo}`);
  console.log(`[pr:auto] Branch: ${branch}`);

  let pushOk = false;
  if (process.env.PR_AUTO_NO_PUSH === "1") {
    console.log("[pr:auto] NOTE: PR_AUTO_NO_PUSH=1, skipping git push (assuming pushed).");
    pushOk = true;
  } else {
    const push = run("git", ["push", "-u", "origin", "HEAD"], { stdio: "inherit" });
    if (!push.ok) {
      console.error("[pr:auto] ERROR: git push failed.");
      console.error("[pr:auto] Fix push errors, then re-run: npm run pr:auto");
      process.exit(1);
    }
    pushOk = true;
  }


  // Mandatory banner before any GitHub API calls
  console.log(`[pr:auto] mode offline=${offline} no_push=${noPush} push_ok=${pushOk}`);
  console.log(`[pr:auto] manual_pr_url: ${manualPrUrl}`);

  // Offline short-circuit BEFORE any GitHub API calls
  if (offline) {
    console.log("[pr:auto] PR_AUTO_OFFLINE=1: exiting before any GitHub API calls.");
    process.exit(pushOk ? 0 : 1);
  }

  // Repo metadata (default branch + delete_branch_on_merge)
  const repoMetaRes = await ghApiJsonRetry([`repos/${ownerRepo}`], "[pr:auto] ERROR: unable to fetch repo metadata.");
  if (!repoMetaRes.ok && repoMetaRes.networkDown) {
    console.log("");
    console.log("[pr:auto] GitHub API is currently unavailable (network/TLS).");
    console.log("[pr:auto] Auto PR creation and auto-merge were not enabled due to network.");
    console.log("[pr:auto] If push succeeded, you can create a PR in the browser:");
    console.log(`  ${manualPrUrl}`);
    process.exit(pushOk ? 0 : 1);
  }
  const repoMeta = repoMetaRes.json;
  const defaultBranch = repoMeta.default_branch || "main";
  const deleteOnMerge = Boolean(repoMeta.delete_branch_on_merge);
  const repoId = repoMeta.node_id;

  // Find existing open PR for this branch
  const headParam = `${ownerName}:${branch}`;
  const prsRes = await ghApiJsonRetry(
    [`repos/${ownerRepo}/pulls`, "-f", `head=${headParam}`, "-f", "state=open"],
    "[pr:auto] ERROR: unable to list PRs for branch."
  );
  if (!prsRes.ok && prsRes.networkDown) {
    console.log("");
    console.log("[pr:auto] GitHub API is currently unavailable (network/TLS).");
    console.log("[pr:auto] Auto PR creation and auto-merge were not enabled due to network.");
    console.log("[pr:auto] If push succeeded, you can create a PR in the browser:");
    console.log(`  ${manualPrUrl}`);
    process.exit(pushOk ? 0 : 1);
  }
  const prs = prsRes.json;

  let pr = Array.isArray(prs) && prs.length > 0 ? prs[0] : null;

  if (!pr) {
    // Create PR
    const title = tryExec("git", ["log", "-1", "--pretty=%s"]) || `PR: ${branch}`;
    const body = tryExec("git", ["log", "-1", "--pretty=%b"]) || `Automated PR for branch ${branch}.`;

    const createRes = await ghApiJsonRetry(
      ["-X", "POST", `repos/${ownerRepo}/pulls`, "-f", `title=${title}`, "-f", `head=${branch}`, "-f", `base=${defaultBranch}`, "-f", `body=${body}`],
      "[pr:auto] ERROR: unable to create PR."
    );
    if (!createRes.ok && createRes.networkDown) {
      console.log("");
      console.log("[pr:auto] GitHub API is currently unavailable (network/TLS).");
      console.log("[pr:auto] PR was not created due to network. Auto-merge was not enabled.");
      console.log("[pr:auto] If push succeeded, you can create a PR in the browser:");
      console.log(`  ${manualPrUrl}`);
      process.exit(pushOk ? 0 : 1);
    }
    pr = createRes.json;
    console.log(`[pr:auto] Created PR #${pr.number}`);
  } else {
    console.log(`[pr:auto] Found existing PR #${pr.number}`);
  }

  // Enable auto-merge (SQUASH) via GraphQL
  const prId = pr.node_id;
  const enableQuery = `
    mutation($pullRequestId: ID!) {
      enablePullRequestAutoMerge(input: { pullRequestId: $pullRequestId, mergeMethod: SQUASH }) {
        pullRequest {
          number
          url
          autoMergeRequest { enabledAt }
        }
      }
    }
  `;
  const enableRes = await ghApiGraphqlRetry(
    enableQuery,
    { pullRequestId: prId },
    "[pr:auto] ERROR: unable to enable auto-merge via GraphQL."
  );
  if (!enableRes.ok && enableRes.networkDown) {
    const prUrlFallback = pr.html_url || "(unknown)";
    console.log("");
    console.log("[pr:auto] GitHub API is currently unavailable (network/TLS).");
    console.log("[pr:auto] Auto-merge was NOT enabled due to network.");
    console.log(`[pr:auto] PR: ${prUrlFallback}`);
    console.log("[pr:auto] If needed, create PR manually:");
    console.log(`  ${manualPrUrl}`);
    process.exit(pushOk ? 0 : 1);
  }

  const prUrl =
    enableRes?.json?.data?.enablePullRequestAutoMerge?.pullRequest?.url ||
    pr.html_url ||
    "(unknown)";

  // Best-effort: enable auto-delete branch on merge at repo level (if possible).
  if (!deleteOnMerge && repoId) {
    const updateRepoQuery = `
      mutation($repositoryId: ID!) {
        updateRepository(input: { repositoryId: $repositoryId, deleteBranchOnMerge: true }) {
          repository { nameWithOwner deleteBranchOnMerge }
        }
      }
    `;
    const updateRes = await ghApiGraphqlRetry(
      updateRepoQuery,
      { repositoryId: repoId },
      "[pr:auto] WARN: unable to enable repo delete-branch-on-merge (GraphQL)."
    );
    if (!updateRes.ok && updateRes.networkDown) {
      console.log("[pr:auto] WARN: delete-branch-on-merge not enabled due to network.");
    } else {
      console.log("[pr:auto] Repo setting: delete branch on merge enabled (best-effort).");
    }
  }

  console.log("");
  console.log("────────────────────────────────────────");
  console.log("  PR Ready for Review");
  console.log("────────────────────────────────────────");
  console.log(`  PR:     ${prUrl}`);
  console.log(`  Branch: ${branch}`);
  console.log("  Merge:  auto-merge enabled (squash)");
  console.log("────────────────────────────────────────");
}

try {
  await main();
} catch (e) {
  console.error("[pr:auto] ERROR:", e?.message || e);
  process.exit(1);
}


