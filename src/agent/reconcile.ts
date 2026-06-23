// RECONCILE — decide if the evidence backs the claim, and write a cited reason.
// The defensibility rule: cite an artifact or return "unverified". Never invent evidence.
//
// STUB: with no LLM key wired, applies the deterministic fallback (no artifacts ->
// unverified). The fleet implements the real reconcile with the Vercel AI SDK
// (generateObject) over OpenRouter, reasoning ONLY over retrieved evidence.

import type { EvidenceBundle, EvidenceCard } from "@/lib/types";

export async function reconcile(bundle: EvidenceBundle): Promise<EvidenceCard> {
  const authored = bundle.artifacts.filter((a) => a.authored);

  // No artifacts found -> the keyword-stuffer case. Honest "unverified".
  if (bundle.artifacts.length === 0) {
    return {
      skill: bundle.skill,
      verdict: "unverified",
      confidence: 0.6,
      citedArtifacts: [],
      reason: `[stub] No artifacts found backing "${bundle.skill}". Real reconcile (LLM over evidence) wired once OPENROUTER_API_KEY is set.`,
      flags: bundle.flags,
    };
  }

  // TODO(fleet): real LLM reconcile — pass {claim, artifacts, signals} and require
  // a JSON {verdict, confidence, citedArtifactUrls[], reason}; validate every cited
  // url exists in `artifacts`; downgrade to "unverified" if the model cites nothing.
  return {
    skill: bundle.skill,
    verdict: authored.length > 0 ? "verified" : "unverified",
    confidence: 0.5,
    citedArtifacts: authored.slice(0, 3),
    reason: `[stub] ${authored.length} authored artifact(s) found for "${bundle.skill}".`,
    flags: bundle.flags,
  };
}
