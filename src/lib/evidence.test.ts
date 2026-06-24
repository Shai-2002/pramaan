import { describe, it, expect } from "vitest";
import { computeTrustScore, summarize } from "@/lib/evidence";
import type { EvidenceCard, Verdict } from "@/lib/types";

const card = (verdict: Verdict, confidence: number): EvidenceCard => ({
  skill: "x",
  verdict,
  confidence,
  citedArtifacts: [],
  reason: "",
  flags: [],
});

describe("computeTrustScore", () => {
  it("returns 0 for no cards", () => {
    expect(computeTrustScore([])).toBe(0);
  });

  it("maps all-verified to 1 and all-contradicted to 0", () => {
    expect(computeTrustScore([card("verified", 0.9), card("verified", 0.8)])).toBe(1);
    expect(computeTrustScore([card("contradicted", 0.95)])).toBe(0);
  });

  it("maps all-unverified to the 0.5 midpoint", () => {
    expect(computeTrustScore([card("unverified", 0.9)])).toBe(0.5);
  });

  it("stays within [0,1] for a mixed profile", () => {
    const score = computeTrustScore([
      card("verified", 0.9),
      card("contradicted", 0.95),
      card("unverified", 0.75),
    ]);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("summarize", () => {
  it("counts each verdict bucket", () => {
    expect(
      summarize([card("verified", 0.9), card("unverified", 0.7), card("contradicted", 0.95)]),
    ).toBe("1 verified, 1 unverified, 1 contradicted across 3 claimed skill(s).");
  });
});
