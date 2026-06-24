import { describe, it, expect } from "vitest";
import { buildBundle, impliedStartYear } from "@/agent/attribute";
import type { AuthoredRepo, GitHubEvidence, WebEvidence } from "@/lib/types";

const repo = (over: Partial<AuthoredRepo>): AuthoredRepo => ({
  name: "next.js",
  url: "https://github.com/leerob/next.js",
  languages: ["TypeScript"],
  deps: ["next"],
  topics: [],
  stars: 100,
  isFork: false,
  createdAt: "2018-01-01T00:00:00Z",
  firstAuthoredCommitDate: "2018-02-01T00:00:00Z",
  ...over,
});

// A leerob-like account: created 2014, owns a Next.js repo first committed 2018.
const ghLeerob: GitHubEvidence = {
  exists: true,
  accountCreatedAt: "2014-08-30T00:00:00Z",
  earliestEvidenceDate: "2018-01-01T00:00:00Z",
  earliestAuthoredCommitDate: "2018-02-01T00:00:00Z",
  authoredRepos: [repo({})],
  authoredRatio: 1,
};
const ghGhost: GitHubEvidence = { exists: false, authoredRepos: [], authoredRatio: 0 };

describe("impliedStartYear", () => {
  it("parses a 4-digit year out of claimedSince", () => {
    expect(impliedStartYear({ skill: "x", claimedSince: "since 2019" })).toBe(2019);
    expect(impliedStartYear({ skill: "x", claimedSince: "2010" })).toBe(2010);
  });
  it("derives from claimedYears relative to now", () => {
    expect(impliedStartYear({ skill: "x", claimedYears: 4 })).toBe(new Date().getFullYear() - 4);
  });
  it("is undefined when nothing is claimed", () => {
    expect(impliedStartYear({ skill: "x" })).toBeUndefined();
  });
});

describe("buildBundle — FROZEN personas (B1 regression guard)", () => {
  it("CONTRADICTED: claimed since 2010 predates a 2014 account", () => {
    const b = buildBundle({ skill: "Next.js", claimedSince: "2010" }, ghLeerob, [], []);
    expect(b.signals.contradiction).toBe(true);
  });

  it("CLEAN: claimed since 2021 on a 2014 account is not contradicted", () => {
    const b = buildBundle({ skill: "Next.js", claimedSince: "2021" }, ghLeerob, [], []);
    expect(b.signals.contradiction).toBe(false);
    expect(b.artifacts.length).toBeGreaterThan(0);
  });

  it("GHOST: a non-existent account yields no artifacts and accountExists=false", () => {
    const b = buildBundle({ skill: "React" }, ghGhost, [], []);
    expect(b.signals.accountExists).toBe(false);
    expect(b.artifacts.length).toBe(0);
  });
});

describe("buildBundle — commit-level provenance (B1)", () => {
  it("flags timeline-thin (NOT contradicted) when commits postdate a possible claim", () => {
    // since 2015 > account year 2014 (no hard contradiction), but < first commit 2018-1.
    const b = buildBundle({ skill: "Next.js", claimedSince: "2015" }, ghLeerob, [], []);
    expect(b.signals.contradiction).toBe(false);
    expect(b.flags.some((f) => f.startsWith("timeline-thin"))).toBe(true);
  });

  it("cites the first authored-commit date on the repo artifact", () => {
    const b = buildBundle({ skill: "Next.js", claimedSince: "2021" }, ghLeerob, [], []);
    expect(b.artifacts[0].date).toBe("2018-02-01T00:00:00Z");
  });
});

describe("buildBundle — web content matching (B2)", () => {
  const live = (content?: string): WebEvidence => ({
    url: "https://example.com/post",
    live: true,
    status: 200,
    content,
  });

  it("content mentioning the skill backs the claim, is labelled, and counts as strong", () => {
    const b = buildBundle({ skill: "Next.js" }, ghGhost, [live("I built this with Next.js")], [
      "https://example.com/post",
    ]);
    const w = b.artifacts.find((a) => a.kind === "writing");
    expect(w).toBeDefined();
    expect(w!.detail).toContain("content mentions");
    expect(b.signals.strongEvidenceCount).toBe(1);
  });

  it("content NOT mentioning the skill is excluded for that skill", () => {
    const b = buildBundle({ skill: "Next.js" }, ghGhost, [live("an essay about gardening")], []);
    expect(b.artifacts.length).toBe(0);
  });

  it("a live URL with unreadable content is liveness-only and NOT strong evidence", () => {
    const b = buildBundle({ skill: "Next.js" }, ghGhost, [live(undefined)], []);
    expect(b.artifacts.length).toBe(1);
    expect(b.artifacts[0].detail).not.toContain("content mentions");
    // SECURITY: an unreadable live URL is a citation but must not, alone, justify "verified".
    expect(b.signals.strongEvidenceCount).toBe(0);
  });
});
