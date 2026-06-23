// GitHub evidence tool — the core of Pramaan's provenance check.
// STUB: returns typed-empty evidence so the app builds. The code-module fleet
// implements the real @octokit/rest logic (authored-vs-forked, per-language
// first-commit dates = the timeline-reconciliation source) against this signature.

import type { GitHubEvidence } from "@/lib/types";

export async function getGitHubEvidence(
  handle: string,
  _skills: string[],
): Promise<GitHubEvidence> {
  // TODO(fleet): real implementation —
  //   1. list non-fork repos the user pushed to (Octokit /users/{h}/repos)
  //   2. for each, sample authored commits (author.login === handle), record diffs/langs
  //   3. firstAuthoredByLanguage[lang] = earliest authored-commit date touching that lang
  //   4. authoredRatio = authored / sampled commits
  void handle;
  return {
    authoredRepos: [],
    firstAuthoredByLanguage: {},
    authoredRatio: 0,
  };
}
