// Pramaan — shared contracts.
// The whole app is built around one idea: a skill CLAIM is only as real as the
// ARTIFACT you can trace it to. Every module below produces or consumes these types.

import { z } from "zod";

/** The verdict Pramaan emits per claimed skill. */
export type Verdict = "verified" | "unverified" | "contradicted";

/** A single skill a candidate claims on their profile. */
export const SkillClaimSchema = z.object({
  skill: z.string().min(1),
  /** Years of experience claimed for this skill, if stated. */
  claimedYears: z.number().nonnegative().optional(),
  /** ISO date (or year) the candidate claims to have started using it. */
  claimedSince: z.string().optional(),
});
export type SkillClaim = z.infer<typeof SkillClaimSchema>;

/** What a recruiter pastes in: a handle + the claims to check, plus optional links. */
export const ProfileInputSchema = z.object({
  githubHandle: z.string().min(1).max(39), // GitHub's max username length
  /** Bounded so a public visitor can't fan out unlimited GitHub/LLM calls per request. */
  claims: z.array(SkillClaimSchema).min(1).max(8),
  /** Deployed app / portfolio URLs the candidate says they built. */
  deployedUrls: z.array(z.string().url()).max(4).optional(),
  /** Blog / writing URLs that back "technical writing" style claims. */
  writingUrls: z.array(z.string().url()).max(4).optional(),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

/** A concrete piece of evidence we found and can cite. */
export type ArtifactKind = "commit" | "repo" | "deploy" | "writing";
export interface Artifact {
  kind: ArtifactKind;
  url: string;
  title?: string;
  /** ISO date of the artifact (e.g. commit authored date, first-commit date). */
  date?: string;
  /** Short human-readable detail used verbatim in the citation. */
  detail?: string;
  /** True only if the candidate actually authored this (not forked / vendored). */
  authored?: boolean;
}

/** Everything the FETCH/ATTRIBUTE stages gathered for one claim, pre-reconcile. */
export interface EvidenceBundle {
  skill: string;
  artifacts: Artifact[];
  /** Raw signals the RECONCILE step reasons over (dates, fork ratios, flags...). */
  signals: Record<string, unknown>;
  /** Non-fatal warnings, e.g. "ai-generated-code-suspected" (flag, never auto-reject). */
  flags: string[];
}

/** The output object for one skill — the heart of the product. */
export interface EvidenceCard {
  skill: string;
  verdict: Verdict;
  /** 0..1 confidence in the verdict. */
  confidence: number;
  /** The artifacts cited in `reason`. MUST be non-empty unless verdict is "unverified". */
  citedArtifacts: Artifact[];
  /** Plain-language justification. Every claim in it must trace to a citedArtifact. */
  reason: string;
  /** Review flags surfaced to a human (never used to auto-reject). */
  flags: string[];
}

/** The full result for a profile: the cards + an aggregate trust feature. */
export interface ProfileVerification {
  handle: string;
  cards: EvidenceCard[];
  /** 0..1 trust-weighted score the Resume Ranker would consume as a feature. */
  trustScore: number;
  summary: string;
  /** ms the verification took, for the "cheap/fast" story. */
  elapsedMs?: number;
}

// ---- Tool contracts (the code-module fleet implements these signatures) ----

/** RESOLVE: turn a profile into the set of artifact sources to fetch. */
export interface ResolvedSources {
  githubHandle: string;
  deployedUrls: string[];
  writingUrls: string[];
}

/** One authored repo with the signals we reason over. */
export interface AuthoredRepo {
  name: string;
  url: string;
  description?: string;
  languages: string[];
  /** package.json dependency names (lowercased), for framework detection. */
  deps: string[];
  topics: string[];
  createdAt?: string;
  /** ISO date of the user's EARLIEST authored commit in this repo (provenance floor). */
  firstAuthoredCommitDate?: string;
  stars: number;
  isFork: boolean;
}

/** GitHub evidence tool — account age, authored repos, framework signals. */
export interface GitHubEvidence {
  /** Whether the handle resolved to a real account. */
  exists: boolean;
  /** Account creation date — the hard floor for timeline reconciliation. */
  accountCreatedAt?: string;
  /** Earliest authored-repo creation date — earliest provable activity. */
  earliestEvidenceDate?: string;
  /** Earliest authored COMMIT date across sampled repos — a stronger provenance floor. */
  earliestAuthoredCommitDate?: string;
  /** Repos the user actually authored (forks excluded). */
  authoredRepos: AuthoredRepo[];
  /** authored (non-fork) repos / total repos sampled. */
  authoredRatio: number;
}

/** Web evidence tool — liveness + content for a deployed/writing URL. */
export interface WebEvidence {
  url: string;
  live: boolean;
  status?: number;
  /** Clean text content (via Jina Reader) if fetched, truncated. */
  content?: string;
}
