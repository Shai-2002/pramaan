import { describe, it, expect } from "vitest";
import { decide } from "@/agent/reconcile";
import type { Artifact, EvidenceBundle } from "@/lib/types";

const bundle = (over: Partial<EvidenceBundle>): EvidenceBundle => ({
  skill: "Next.js",
  artifacts: [],
  signals: {},
  flags: [],
  ...over,
});
const art: Artifact = { kind: "repo", url: "https://github.com/x/y", title: "y" };

describe("decide — the deterministic verdict core", () => {
  it("no resolved account => unverified", () => {
    const d = decide(bundle({ signals: { accountExists: false } }));
    expect(d.verdict).toBe("unverified");
    expect(d.confidence).toBe(0.9);
  });

  it("timeline contradiction => contradicted, carrying the reason", () => {
    const d = decide(
      bundle({ signals: { accountExists: true, contradiction: true, contradictionReason: "impossible" } }),
    );
    expect(d.verdict).toBe("contradicted");
    expect(d.confidence).toBe(0.95);
    expect(d.reason).toBe("impossible");
  });

  it("account exists but no artifacts => unverified", () => {
    const d = decide(bundle({ signals: { accountExists: true }, artifacts: [] }));
    expect(d.verdict).toBe("unverified");
    expect(d.confidence).toBe(0.75);
  });

  it("bare liveness-only artifact (strongEvidenceCount 0) => unverified, not verified", () => {
    const livenessOnly: Artifact = { kind: "deploy", url: "https://x.dev", detail: "live (HTTP 200)" };
    const d = decide(
      bundle({ signals: { accountExists: true, strongEvidenceCount: 0 }, artifacts: [livenessOnly] }),
    );
    expect(d.verdict).toBe("unverified");
  });

  it("strong evidence present => verified", () => {
    const d = decide(bundle({ signals: { accountExists: true, strongEvidenceCount: 1 }, artifacts: [art] }));
    expect(d.verdict).toBe("verified");
  });

  it("authored artifacts => verified with confidence scaling by count", () => {
    const d = decide(bundle({ signals: { accountExists: true }, artifacts: [art, art] }));
    expect(d.verdict).toBe("verified");
    expect(d.confidence).toBeCloseTo(0.84, 5); // 0.6 + 0.12*2
  });

  it("verified confidence is capped at 0.95", () => {
    const many = Array.from({ length: 10 }, () => art);
    expect(decide(bundle({ signals: { accountExists: true }, artifacts: many })).confidence).toBe(0.95);
  });
});
