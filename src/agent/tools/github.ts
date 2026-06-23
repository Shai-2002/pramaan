// GitHub evidence tool — the core of Pramaan's provenance check.
// Reads account age (the timeline-reconciliation floor), authored (non-fork) repos,
// their languages, and package.json deps (framework detection). Uses GITHUB_TOKEN
// for the 5000/hr rate limit; degrades to unauthenticated (60/hr) if absent.

import { Octokit } from "@octokit/rest";
import type { AuthoredRepo, GitHubEvidence } from "@/lib/types";

const octokit = new Octokit(
  process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {},
);

const MAX_REPOS = 15; // most-recently-pushed non-fork repos to inspect (per-repo calls run in parallel)

async function fetchPackageDeps(owner: string, repo: string): Promise<string[]> {
  try {
    const res = await octokit.rest.repos.getContent({ owner, repo, path: "package.json" });
    const data = res.data as { content?: string };
    if (!data.content) return [];
    const json = JSON.parse(Buffer.from(data.content, "base64").toString("utf8"));
    return Object.keys({ ...json.dependencies, ...json.devDependencies }).map((d) =>
      d.toLowerCase(),
    );
  } catch {
    return [];
  }
}

export async function getGitHubEvidence(
  handle: string,
  _skills: string[],
): Promise<GitHubEvidence> {
  let createdAt: string | undefined;
  try {
    const user = await octokit.rest.users.getByUsername({ username: handle });
    createdAt = user.data.created_at;
  } catch {
    return { exists: false, authoredRepos: [], authoredRatio: 0 };
  }

  const all = await octokit.rest.repos.listForUser({
    username: handle,
    per_page: 100,
    sort: "pushed",
    type: "owner",
  });
  const total = all.data.length;
  const nonFork = all.data.filter((r) => !r.fork).slice(0, MAX_REPOS);

  // Per-repo language + package.json lookups run concurrently (the latency fix).
  const authoredRepos: AuthoredRepo[] = await Promise.all(
    nonFork.map(async (r) => {
      let languages: string[] = [];
      try {
        const langs = await octokit.rest.repos.listLanguages({ owner: handle, repo: r.name });
        languages = Object.keys(langs.data);
      } catch {
        /* ignore */
      }
      const isJsTs = languages.some((l) => ["JavaScript", "TypeScript"].includes(l));
      const deps = isJsTs ? await fetchPackageDeps(handle, r.name) : [];
      return {
        name: r.name,
        url: r.html_url,
        description: r.description ?? undefined,
        languages,
        deps,
        topics: r.topics ?? [],
        createdAt: r.created_at ?? undefined,
        stars: r.stargazers_count ?? 0,
        isFork: false,
      };
    }),
  );

  const dates = authoredRepos
    .map((r) => r.createdAt)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    exists: true,
    accountCreatedAt: createdAt,
    earliestEvidenceDate: dates[0],
    authoredRepos,
    authoredRatio: total === 0 ? 0 : nonFork.length / total,
  };
}
