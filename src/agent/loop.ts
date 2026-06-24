// The Pramaan agent loop: RESOLVE -> FETCH -> ATTRIBUTE -> RECONCILE -> EMIT.

import type { ProfileInput, ProfileVerification } from "@/lib/types";
import { getGitHubEvidence } from "@/agent/tools/github";
import { getWebEvidence } from "@/agent/tools/web";
import { buildBundle } from "@/agent/attribute";
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
  const [gh, web] = await Promise.all([
    getGitHubEvidence(sources.githubHandle, skills),
    Promise.all([...sources.deployedUrls, ...sources.writingUrls].map(getWebEvidence)),
  ]);

  // ATTRIBUTE + RECONCILE per claim (reconcile may call the cheap LLM in parallel).
  // buildBundle decides per-skill which live URLs back the claim (by content match).
  const cards = await Promise.all(
    input.claims.map((claim) => reconcile(buildBundle(claim, gh, web, sources.writingUrls))),
  );

  return {
    handle: sources.githubHandle,
    cards,
    trustScore: computeTrustScore(cards),
    summary: summarize(cards),
    elapsedMs: Date.now() - startedAt,
  };
}
