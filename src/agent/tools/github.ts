// GitHub evidence tool — the core of Pramaan's provenance check.
// Reads account age (the timeline-reconciliation floor), authored (non-fork) repos,
// their languages, package.json deps (framework detection), and the EARLIEST authored
// commit date in the most-relevant repos (a stronger provenance floor than repo
// creation). Uses GITHUB_TOKEN for the 5000/hr rate limit; degrades to unauthenticated
// (60/hr) if absent.

import { Octokit } from "@octokit/rest";
import type { AuthoredRepo, GitHubEvidence } from "@/lib/types";

const octokit = new Octokit(
  process.env.GITHUB_TOKEN ? { auth: process.env.GITHUB_TOKEN } : {},
);

const MAX_REPOS = 15; // most-recently-pushed non-fork repos to inspect (per-repo calls run in parallel)
const MAX_COMMIT_PROBES = 5; // repos (top by stars) we pull a first-commit date for — bounds rate-limit cost

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

/**
 * Earliest commit authored by `author` in a repo, in 2 API calls regardless of history
 * length: ask for 1 commit (newest first), read the Link header's rel="last" page number,
 * then fetch that single oldest page. Filtering by author excludes forked/vendored history.
 */
async function fetchFirstAuthoredCommitDate(
  owner: string,
  repo: string,
  author: string,
): Promise<string | undefined> {
  const dateOf = (c?: {
    commit?: { author?: { date?: string } | null; committer?: { date?: string } | null };
  }) => c?.commit?.author?.date ?? c?.commit?.committer?.date ?? undefined;
  try {
    const first = await octokit.rest.repos.listCommits({ owner, repo, author, per_page: 1 });
    if (first.data.length === 0) return undefined;
    const link = first.headers.link;
    const lastPage = link?.match(/[?&]page=(\d+)>;\s*rel="last"/)?.[1];
    if (!lastPage) return dateOf(first.data[0]); // <=1 page: the only authored commit is the earliest
    const last = await octokit.rest.repos.listCommits({
      owner,
      repo,
      author,
      per_page: 1,
      page: Number(lastPage),
    });
    return dateOf(last.data[0]) ?? dateOf(first.data[0]);
  } catch {
    return undefined;
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

  // Commit-level provenance: pull the earliest authored-commit date for the top repos
  // by stars (the ones most likely to be cited). Bounded to MAX_COMMIT_PROBES repos.
  const probeRepos = [...authoredRepos].sort((a, b) => b.stars - a.stars).slice(0, MAX_COMMIT_PROBES);
  await Promise.all(
    probeRepos.map(async (r) => {
      r.firstAuthoredCommitDate = await fetchFirstAuthoredCommitDate(handle, r.name, handle);
    }),
  );

  const repoDates = authoredRepos
    .map((r) => r.createdAt)
    .filter((d): d is string => Boolean(d))
    .sort();
  const commitDates = authoredRepos
    .map((r) => r.firstAuthoredCommitDate)
    .filter((d): d is string => Boolean(d))
    .sort();

  return {
    exists: true,
    accountCreatedAt: createdAt,
    earliestEvidenceDate: repoDates[0],
    earliestAuthoredCommitDate: commitDates[0],
    authoredRepos,
    authoredRatio: total === 0 ? 0 : nonFork.length / total,
  };
}
