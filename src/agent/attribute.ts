// ATTRIBUTE — turn raw GitHub/web evidence into a per-skill EvidenceBundle, and run
// the timeline-reconciliation check (the honeypot kill-shot): a claim whose implied
// start date predates the account's existence is chronologically impossible.

import type {
  Artifact,
  AuthoredRepo,
  EvidenceBundle,
  GitHubEvidence,
  SkillClaim,
  WebEvidence,
} from "@/lib/types";

type Alias = { langs?: string[]; deps?: string[]; keywords?: string[] };

const SKILL_ALIASES: Record<string, Alias> = {
  "next.js": { langs: ["TypeScript", "JavaScript"], deps: ["next"], keywords: ["next.js", "nextjs"] },
  nextjs: { langs: ["TypeScript", "JavaScript"], deps: ["next"], keywords: ["next.js", "nextjs"] },
  react: { langs: ["TypeScript", "JavaScript"], deps: ["react"], keywords: ["react"] },
  typescript: { langs: ["TypeScript"], deps: ["typescript"], keywords: ["typescript"] },
  javascript: { langs: ["JavaScript"], keywords: ["javascript"] },
  "node.js": { langs: ["JavaScript", "TypeScript"], deps: ["express", "fastify"], keywords: ["node"] },
  python: { langs: ["Python"], keywords: ["python"] },
  graphql: { deps: ["graphql", "@apollo/server", "apollo-server"], keywords: ["graphql"] },
  pytorch: { langs: ["Python"], deps: ["torch"], keywords: ["pytorch"] },
  kubernetes: { langs: ["Dockerfile", "HCL", "Smarty"], keywords: ["kubernetes", "k8s", "helm"] },
  terraform: { langs: ["HCL"], keywords: ["terraform"] },
  docker: { langs: ["Dockerfile"], keywords: ["docker"] },
  "self-hosting": { langs: ["Dockerfile", "Shell"], keywords: ["self-host", "selfhost", "deploy", "nginx", "docker"] },
  deployment: { langs: ["Dockerfile", "Shell"], keywords: ["deploy", "nginx", "docker", "self-host"] },
  "technical writing": { langs: ["MDX", "Markdown"], keywords: ["docs", "blog", "writing", "mdx"] },
};

function aliasFor(skill: string): Alias {
  const key = skill.trim().toLowerCase();
  return SKILL_ALIASES[key] ?? { keywords: [key], langs: [], deps: [] };
}

function repoMatchesSkill(repo: AuthoredRepo, a: Alias): boolean {
  const langs = (a.langs ?? []).map((l) => l.toLowerCase());
  if (repo.languages.some((l) => langs.includes(l.toLowerCase()))) return true;
  const deps = a.deps ?? [];
  if (repo.deps.some((d) => deps.some((want) => d === want || d.includes(want)))) return true;
  const hay = `${repo.name} ${repo.description ?? ""} ${repo.topics.join(" ")}`.toLowerCase();
  if ((a.keywords ?? []).some((k) => hay.includes(k))) return true;
  return false;
}

function year(iso?: string): number | undefined {
  if (!iso) return undefined;
  const y = new Date(iso).getFullYear();
  return Number.isFinite(y) ? y : undefined;
}

/** Implied start year from claimedSince, else from claimedYears relative to now. */
function impliedStartYear(claim: SkillClaim): number | undefined {
  if (claim.claimedSince) {
    const m = claim.claimedSince.match(/(\d{4})/);
    if (m) return Number(m[1]);
  }
  if (typeof claim.claimedYears === "number") {
    return new Date().getFullYear() - Math.floor(claim.claimedYears);
  }
  return undefined;
}

export function buildBundle(
  claim: SkillClaim,
  gh: GitHubEvidence,
  liveDeploys: Artifact[],
): EvidenceBundle {
  const a = aliasFor(claim.skill);
  const matched = gh.authoredRepos.filter((r) => repoMatchesSkill(r, a));

  const artifacts: Artifact[] = [
    ...matched
      .sort((x, y) => y.stars - x.stars)
      .slice(0, 4)
      .map<Artifact>((r) => ({
        kind: "repo",
        url: r.url,
        title: r.name,
        date: r.createdAt,
        detail: `authored repo${r.stars ? `, ${r.stars}★` : ""}${r.languages.length ? `, ${r.languages.slice(0, 3).join("/")}` : ""}`,
        authored: true,
      })),
    ...liveDeploys,
  ];

  const accountYear = year(gh.accountCreatedAt);
  const start = impliedStartYear(claim);
  const flags: string[] = [];

  // Timeline reconciliation — the honeypot kill-shot.
  let contradiction = false;
  let contradictionReason: string | undefined;
  if (gh.exists && start !== undefined && accountYear !== undefined && start < accountYear) {
    contradiction = true;
    contradictionReason =
      `Claim implies using ${claim.skill} since ${start}, but the GitHub account did not exist until ${accountYear}. ` +
      `No authored artifact can predate the account, so the claimed timeline is chronologically impossible.`;
  }

  if (gh.exists && gh.authoredRatio < 0.34 && gh.authoredRepos.length > 0) {
    flags.push("low-authored-ratio: most repos are forks; authorship is thin");
  }

  return {
    skill: claim.skill,
    artifacts,
    signals: {
      accountExists: gh.exists,
      accountCreatedAt: gh.accountCreatedAt,
      accountYear,
      impliedStartYear: start,
      matchedRepoCount: matched.length,
      earliestEvidenceDate: gh.earliestEvidenceDate,
      contradiction,
      contradictionReason,
    },
    flags,
  };
}
