// The Pramaan agent loop: RESOLVE -> FETCH -> ATTRIBUTE -> RECONCILE -> EMIT.
// This orchestrator is real; individual tools are stubs until the code-module fleet
// fills them in. It already produces a valid ProfileVerification end-to-end.

import type {
  ProfileInput,
  ProfileVerification,
  EvidenceBundle,
  Artifact,
} from "@/lib/types";
import { getGitHubEvidence } from "@/agent/tools/github";
import { getWebEvidence } from "@/agent/tools/web";
import { reconcile } from "@/agent/reconcile";
import { computeTrustScore, summarize } from "@/lib/evidence";

/** RESOLVE: collect the artifact sources to probe for this profile. */
function resolve(input: ProfileInput) {
  return {
    githubHandle: input.githubHandle,
    deployedUrls: input.deployedUrls ?? [],
    writingUrls: input.writingUrls ?? [],
  };
}

export async function verifyProfile(
  input: ProfileInput,
  startedAt = Date.now(),
): Promise<ProfileVerification> {
  const sources = resolve(input);
  const skills = input.claims.map((c) => c.skill);

  // FETCH (shared across claims): GitHub authorship/timeline + web liveness.
  const gh = await getGitHubEvidence(sources.githubHandle, skills);
  const web = await Promise.all(sources.deployedUrls.map(getWebEvidence));

  const liveDeploys: Artifact[] = web
    .filter((w) => w.live)
    .map((w) => ({ kind: "deploy", url: w.url, detail: `live (HTTP ${w.status})` }));

  const cards = await Promise.all(
    input.claims.map(async (claim) => {
      const repos = gh.authoredRepos.filter((r) =>
        r.languages.some((l) => l.toLowerCase() === claim.skill.toLowerCase()),
      );
      const artifacts: Artifact[] = [
        ...repos.map<Artifact>((r) => ({
          kind: "repo",
          url: r.url,
          title: r.name,
          date: r.firstAuthoredCommitDate,
          authored: !r.isFork,
        })),
        ...liveDeploys,
      ];

      // ATTRIBUTE signals the RECONCILE step reasons over (timeline = honeypot kill-shot).
      const firstAuthored = gh.firstAuthoredByLanguage[claim.skill];
      const bundle: EvidenceBundle = {
        skill: claim.skill,
        artifacts,
        signals: {
          claimedSince: claim.claimedSince,
          claimedYears: claim.claimedYears,
          firstAuthoredForSkill: firstAuthored,
          authoredRatio: gh.authoredRatio,
        },
        flags: [],
      };
      return reconcile(bundle);
    }),
  );

  return {
    handle: sources.githubHandle,
    cards,
    trustScore: computeTrustScore(cards),
    summary: summarize(cards),
    elapsedMs: Date.now() - startedAt,
  };
}
