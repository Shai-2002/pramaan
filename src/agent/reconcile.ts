// RECONCILE — decide the verdict and write a cited, defensible reason.
//
// Verdict is DETERMINISTIC (date logic), so correctness never depends on the LLM:
//   - timeline contradiction  -> "contradicted"  (the honeypot kill-shot)
//   - no artifacts found       -> "unverified"   (the keyword-stuffer)
//   - authored artifacts found -> "verified"
// The LLM (cheap, non-reasoning gemini-2.5-flash-lite) only rewrites the plain-language
// reason, constrained to the artifacts we pass and REQUIRED to stay consistent with the
// verdict. A guard rejects any "verified" reason that smuggles in doubt language. If the
// key is missing or anything fails, we keep the deterministic reason. The model can NEVER
// change the verdict or invent evidence.

import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { EvidenceBundle, EvidenceCard, Verdict } from "@/lib/types";
import { llmBudgetAvailable, recordLlmCall } from "@/lib/ratelimit";

const MODEL = process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-lite";
const DOUBT = /insufficient|cannot verify|can't verify|no evidence|unverified|not enough|unable to/i;

/** Deterministic verdict — the credibility core. Exported for unit testing. */
export function decide(bundle: EvidenceBundle): { verdict: Verdict; confidence: number; reason: string } {
  const s = bundle.signals as Record<string, unknown>;
  if (s.accountExists === false) {
    return {
      verdict: "unverified",
      confidence: 0.9,
      reason: `No GitHub account resolved for this handle, so no artifact backs "${bundle.skill}".`,
    };
  }
  if (s.contradiction === true) {
    return {
      verdict: "contradicted",
      confidence: 0.95,
      reason: String(s.contradictionReason ?? `Claimed timeline for "${bundle.skill}" is impossible given the account age.`),
    };
  }
  // Gate "verified" on STRONG evidence (authored repos or content-matched pages), not on
  // bare liveness. Falls back to artifact count when the signal is absent (older bundles).
  const strong = typeof s.strongEvidenceCount === "number" ? s.strongEvidenceCount : bundle.artifacts.length;
  if (strong === 0) {
    return {
      verdict: "unverified",
      confidence: 0.75,
      reason: `No authored repository, skill-relevant deployment, or published work found that backs "${bundle.skill}".`,
    };
  }
  const titles = bundle.artifacts.slice(0, 2).map((x) => x.title ?? x.url).join(", ");
  return {
    verdict: "verified",
    confidence: Math.min(0.95, 0.6 + 0.12 * bundle.artifacts.length),
    reason: `Authored evidence backs "${bundle.skill}": ${titles}.`,
  };
}

async function polishReason(
  bundle: EvidenceBundle,
  base: { verdict: Verdict; reason: string },
): Promise<string> {
  // Skip the LLM for "unverified": there's nothing to cite, and the deterministic line is exact.
  if (!process.env.OPENROUTER_API_KEY || base.verdict === "unverified") return base.reason;
  // Spend circuit-breaker: once the daily LLM budget is spent, keep the (correct)
  // deterministic reason instead of calling the model. The verdict is unaffected.
  if (!llmBudgetAvailable()) return base.reason;
  try {
    recordLlmCall();
    const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
    const cited =
      bundle.artifacts
        .map((a) => `- ${a.title ?? a.url} (${a.kind}${a.date ? `, ${a.date.slice(0, 10)}` : ""})`)
        .join("\n") || "(none)";
    const guide =
      base.verdict === "verified"
        ? "The verdict is VERIFIED. Affirm in 1-2 sentences that the skill is backed, naming 1-3 of the listed artifacts. Do NOT say the evidence is insufficient, unverified, or that you cannot verify it."
        : "The verdict is CONTRADICTED. In 1-2 sentences state plainly why the claim is chronologically impossible, using the account-creation year vs the claimed start year from the signals.";
    const { text } = await generateText({
      model: openrouter(MODEL),
      system:
        "You write a recruiter-facing justification for a skill-verification verdict. " +
        "Stay strictly consistent with the given verdict. Use ONLY the listed artifacts and signal dates. " +
        "Never mention a skill, employer, repo, or date not present in the evidence. Be specific and honest; no hype.",
      prompt:
        `Skill: ${bundle.skill}\nVerdict: ${base.verdict}\n${guide}\n` +
        `Signal dates: ${JSON.stringify({
          accountCreatedAt: (bundle.signals as Record<string, unknown>).accountCreatedAt,
          accountYear: (bundle.signals as Record<string, unknown>).accountYear,
          impliedStartYear: (bundle.signals as Record<string, unknown>).impliedStartYear,
        })}\nCited artifacts:\n${cited}`,
      maxOutputTokens: 220,
    });
    const out = text.trim();
    // Consistency guard: a "verified" reason must not smuggle in doubt language.
    if (!out || (base.verdict === "verified" && DOUBT.test(out))) return base.reason;
    return out;
  } catch {
    return base.reason; // robustness: deterministic reason if the LLM is unavailable
  }
}

export async function reconcile(bundle: EvidenceBundle): Promise<EvidenceCard> {
  const base = decide(bundle);
  const reason = await polishReason(bundle, base);
  return {
    skill: bundle.skill,
    verdict: base.verdict,
    confidence: base.confidence,
    citedArtifacts: base.verdict === "unverified" ? [] : bundle.artifacts.slice(0, 4),
    reason,
    flags: bundle.flags,
  };
}
