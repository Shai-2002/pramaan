# Pramaan — Demo Personas

```json
{
  "verified": {
    "handle": "leerob",
    "realNameOrLabel": "Lee Robinson",
    "whyVerified": "Real, highly-documented public maintainer (GitHub user ID 9113740, account created 2014-10-09, ~16k followers). Every claimed skill is backed by commits whose author login resolves to `leerob` (not a fork, not a co-author artifact) AND by a live deployed URL he owns. The claimed time windows reconcile with the actual first-authored-commit dates: his authored docs/code commits in vercel/next.js run from at least Dec 2020 through Sep 2025, so a 'Next.js since ~2020' claim holds with margin. This is the case where RECONCILE (evidence) and ATTRIBUTE (authored-vs-forked, timeline) both pass cleanly, so the Evidence Card renders green with citations the judges can click and check in real time.",
    "skillsToClaim": [
      "Next.js / React (App Router, Server Actions, RSC) since ~2020",
      "TypeScript (production app + open-source library code)",
      "Self-hosting / deployment (Next.js + Postgres + Nginx on Linux)",
      "Developer-facing technical writing & docs (authored, merged docs PRs)"
    ],
    "concreteEvidenceItems": [
      "AUTHORED commits in vercel/next.js by login `leerob`, e.g. PR #16277 'Add docs on authentication patterns' (2020-12-31), PR #78557 'docs: remove Vercel mentions and improve deployment page' (2025-04-25), PR #79269 'docs: streaming responses with pages API routes' (2025-05-16), PR #83903 'docs: update command to use npx for tracing files' (2025-09-17) — query: https://api.github.com/repos/vercel/next.js/commits?author=leerob",
      "leerob/leerob.io — his own Next.js + TypeScript + MDX site repo (not a fork), created 2018-12-16, with commits authored by login `leerob` (e.g. 'Update template' 2025-06-05, 'Update README.md' 2025-04-28): https://github.com/leerob/leerob.io and authored-commit query https://api.github.com/repos/leerob/leerob.io/commits?author=leerob",
      "leerob/next-self-host — TypeScript repo, 'An example deploying Next / Postgres / Nginx to a Ubuntu Linux server', ~1.5k stars, not a fork, created 2024-10-05: https://github.com/leerob/next-self-host (backs the self-host/deployment skill claim)",
      "LIVE deployed URL he owns: https://leerob.com — returns 200, title/content is his personal site ('making technology easy to understand'), which is the FETCH-stage URL-liveness proof tying the repo to a real running artifact"
    ],
    "sourceUrls": [
      "https://github.com/leerob",
      "https://api.github.com/users/leerob",
      "https://api.github.com/repos/vercel/next.js/commits?author=leerob",
      "https://github.com/leerob/leerob.io",
      "https://github.com/leerob/next-self-host",
      "https://leerob.com"
    ]
  },
  "contradicted": {
    "setup": "Use a CLEARLY-SYNTHETIC throwaway account that WE create and control, named so it cannot be confused with any real person — e.g. handle `pramaan-demo-honeypot` (or a fresh sandbox account created on stage, account age visible as days). On the profile we, the demo operators, ASSERT the false skill claims on the candidate's behalf as the 'pasted resume input'. The account is a blank/near-empty GitHub created days before the demo with one or two trivial commits (e.g. a single 'Initial commit' on a README, or a 2026 repo) and nothing else. Critically: the FALSE CLAIM is about a time window, and the account's own metadata (account created_at + earliest authored commit date) sits entirely AFTER the claimed window, so the contradiction is mechanical and undeniable — no human judgment needed, the dates simply don't fit.",
    "fabricatedClaims": [
      "'8 years of React, professionally since 2017'",
      "'Senior backend engineer, Kubernetes in production since 2018'",
      "'Author/maintainer of a popular open-source library with 10k+ stars'"
    ],
    "howTimelineContradicts": "Pramaan's ATTRIBUTE stage runs timeline reconciliation — the honeypot kill-shot. RESOLVE finds the handle; FETCH pulls account created_at and the earliest commit whose author login matches the handle. For `pramaan-demo-honeypot` the account was created in 2026 and its FIRST (and only) authored commit is dated 2026. The claim asserts React authorship 'since 2017' and Kubernetes 'since 2018'. The earliest possible authored artifact (2026) post-dates the entire claimed window by ~8-9 years, so the claim cannot be true — it is impossible, not merely unproven. Verdict: CONTRADICTED (high confidence), plain-language reason: 'No authored commit exists before 2026; the account itself did not exist in the claimed 2017 window, so 8 years of React since 2017 is chronologically impossible.' The 10k-stars library claim additionally fails ATTRIBUTE because no repo owned/authored by the handle has those stars (and any starred repo would resolve as forked-not-authored). This is exactly the ~80 'impossible' honeypot profiles in Redrob's data — caught by dates, not by reading the resume text.",
    "ethicsNote": "The contradicted persona is a synthetic account WE own and label as a demo honeypot; we never point Pramaan's CONTRADICTED verdict at a real named individual. The false claims are asserted by us as test input, not scraped from anyone's real profile. On stage we state explicitly that this is a fabricated demo identity. This keeps the demo honest: we are proving the mechanism (timeline reconciliation) generically, not defaming a person."
  },
  "unverified": {
    "setup": "A synthetic candidate persona, label 'Buzzword Resume (no artifacts)' — e.g. claimed handle that either does not exist on GitHub, or a real-but-empty placeholder account with zero public repos, zero authored commits, and no linked deployed URL or blog. The pasted resume is dense with in-demand skills but points at no resolvable evidence. This is the keyword-stuffer archetype: the profile TEXT is maximized for the Resume Ranker, but there is nothing behind it for Pramaan to FETCH. Optionally use a generic placeholder like `ghost-candidate-2026` or simply a 404 handle to show the RESOLVE stage failing.",
    "fabricatedClaims": [
      "'Expert in React, Next.js, TypeScript, Node.js, GraphQL'",
      "'Production experience with Kubernetes, Docker, Terraform, AWS, GCP'",
      "'Built scalable microservices and ML pipelines (Python, PyTorch, LLMs)'",
      "'4+ years across full-stack and DevOps'"
    ],
    "whyNoArtifacts": "Pramaan runs the per-skill agent loop and every stage comes up empty. RESOLVE: the handle 404s (or resolves to an account with 0 public repos), no deployed URL, no blog — Exa/Jina find no published writing tied to the identity. FETCH: GitHub API returns no authored commits, no diffs, no live artifact to probe; Playwright has no URL to check for liveness. RECONCILE: there is literally no retrieved evidence to reason over, and Pramaan scores evidence, NOT the profile text, so the keyword density buys nothing. The verdict is UNVERIFIED (not CONTRADICTED) — the distinction matters: nothing proves the claim false, but nothing supports it either, so confidence in the claim is zero. Plain-language reason: 'No authored commits, no live deployment, and no published work could be found for any claimed skill; the resume asserts these abilities but points at no verifiable artifact.' This is the asymmetry thesis in action: writing the claims is free, producing the provenance is not, and the keyword-stuffer produced none.",
    "ethicsNote": "Fully synthetic placeholder identity created for the demo; uses a non-existent or deliberately-empty handle so no real person is implicated. We only ever resolve candidate-volunteered public links, and 'UNVERIFIED' is explicitly framed as 'no evidence found,' never as an accusation of lying."
  },
  "notes": "All VERIFIED evidence was checked live against the GitHub API and the live site during this task (as of 2026-06-23). Author-login filtering (?author=leerob) confirms the commits are AUTHORED, not merely co-authored or in a forked repo — this is the ATTRIBUTE distinction Pramaan relies on; note that leerob.io's RECENT default-branch commits are mostly dependabot/bot, so for the live demo cite the ?author=leerob query (and the vercel/next.js authored commits + next-self-host) rather than the repo's top commit list, which would otherwise show bot authorship. Recommended demo flow: paste `leerob` -> 3 green cards citing the next.js authored PRs (2020-2025), next-self-host, and live leerob.com; then paste the synthetic honeypot handle -> 1+ red CONTRADICTED card driven purely by created_at/first-commit dates vs the 'since 2017' claim; then paste the empty/404 handle -> UNVERIFIED cards where RESOLVE itself fails. Keep the honeypot and keyword-stuffer accounts clearly synthetic and operator-owned; state on stage that both are fabricated demo identities so no real individual is portrayed as a fraud. One safer alternative if a fresh account looks too contrived live: pre-create the honeypot account a week before so its created_at is real and visibly recent, making the timeline contradiction self-evident from public metadata.\"}"
}
```
