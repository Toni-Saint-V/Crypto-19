#!/usr/bin/env node
import { spawnSync } from "node:child_process";

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

function main() {
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
  if (dirty) {
    console.error("[pr:auto] ERROR: uncommitted changes detected.");
    console.error("[pr:auto] Commit or stash changes first.");
    process.exit(1);
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

  console.log(`[pr:auto] Repo:   ${ownerRepo}`);
  console.log(`[pr:auto] Branch: ${branch}`);

  // Push branch (best-effort but usually required for PR creation)
  const push = run("git", ["push", "-u", "origin", "HEAD"], { stdio: "inherit" });
  if (!push.ok) {
    console.error("[pr:auto] ERROR: git push failed.");
    console.error("[pr:auto] Fix push errors, then re-run: npm run pr:auto");
    process.exit(1);
  }

  // Repo metadata (default branch + delete_branch_on_merge)
  const repoMeta = ghApiJson([`repos/${ownerRepo}`], "[pr:auto] ERROR: unable to fetch repo metadata.");
  const defaultBranch = repoMeta.default_branch || "main";
  const deleteOnMerge = Boolean(repoMeta.delete_branch_on_merge);
  const repoId = repoMeta.node_id;

  // Find existing open PR for this branch
  const prs = ghApiJson(
    [
      `repos/${ownerRepo}/pulls`,
      "-f",
      `head=${owner}:${branch}`,
      "-f",
      "state=open",
    ],
    "[pr:auto] ERROR: unable to list PRs for branch."
  );

  let pr = Array.isArray(prs) && prs.length > 0 ? prs[0] : null;

  if (!pr) {
    // Create PR
    const title = tryExec("git", ["log", "-1", "--pretty=%s"]) || `PR: ${branch}`;
    const body = tryExec("git", ["log", "-1", "--pretty=%b"]) || `Automated PR for branch ${branch}.`;

    pr = ghApiJson(
      [
        "-X",
        "POST",
        `repos/${ownerRepo}/pulls`,
        "-f",
        `title=${title}`,
        "-f",
        `head=${branch}`,
        "-f",
        `base=${defaultBranch}`,
        "-f",
        `body=${body}`,
      ],
      "[pr:auto] ERROR: unable to create PR."
    );
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
  const enableRes = ghApiGraphql(
    enableQuery,
    { pullRequestId: prId },
    "[pr:auto] ERROR: unable to enable auto-merge via GraphQL."
  );

  const prUrl =
    enableRes?.data?.enablePullRequestAutoMerge?.pullRequest?.url ||
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
    const r = run("gh", ["api", "graphql", "-f", `query=${updateRepoQuery}`, "-f", `repositoryId=${repoId}`], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    if (r.ok) {
      console.log("[pr:auto] Repo setting: delete branch on merge enabled (best-effort).");
    } else {
      console.log("[pr:auto] WARN: Could not enable repo delete-branch-on-merge (permissions/repo settings).");
      console.log("[pr:auto] You can enable it in GitHub repo settings, or delete the branch manually after merge.");
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
  main();
} catch (e) {
  console.error("[pr:auto] ERROR:", e?.message || e);
  process.exit(1);
}


