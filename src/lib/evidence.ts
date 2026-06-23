// Aggregate the per-skill cards into the trust feature the Resume Ranker consumes.

import type { EvidenceCard, Verdict } from "@/lib/types";

const WEIGHT: Record<Verdict, number> = {
  verified: 1,
  unverified: 0,
  contradicted: -1,
};

/** 0..1 trust score: confidence-weighted mean of verdict polarity, squashed to [0,1]. */
export function computeTrustScore(cards: EvidenceCard[]): number {
  if (cards.length === 0) return 0;
  let num = 0;
  let den = 0;
  for (const c of cards) {
    const w = Math.max(0.1, c.confidence);
    num += WEIGHT[c.verdict] * w;
    den += w;
  }
  const raw = den === 0 ? 0 : num / den; // [-1, 1]
  return Math.round(((raw + 1) / 2) * 100) / 100; // [0, 1]
}

export function summarize(cards: EvidenceCard[]): string {
  const v = cards.filter((c) => c.verdict === "verified").length;
  const u = cards.filter((c) => c.verdict === "unverified").length;
  const x = cards.filter((c) => c.verdict === "contradicted").length;
  return `${v} verified, ${u} unverified, ${x} contradicted across ${cards.length} claimed skill(s).`;
}
