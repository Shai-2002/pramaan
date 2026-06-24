# Pramaan — India Runs Ideathon (Sub-track 1) Build Plan

## Context

Shai is entering hack2skill × Redrob AI's **"India Runs"** hackathon. The event has 3 main tracks
(₹50L+ total): **Data & AI** (₹10L, candidate ranking — handled in a *separate* Claude Code session),
**Ideathon** (₹30L, the biggest pool — **this session**), and **Social Media** (₹10L).

The Ideathon has 3 internal sub-tracks (the 3 PPTs Shai downloaded):
- **Sub-track 1 — Deep Technical / AI-native** ← we picked this. 16-slide PDF deck, 5 mandatory diagrams.
- Sub-track 2 — Product Growth / GTM.
- Sub-track 3 — Beginner / Accessible.

Submission for any sub-track = a **PDF pitch deck**; code/demo/Figma/video are *optional* — which is
exactly our edge: a real working AI demo crushes a field of slideware. Judges = Redrob leadership +
AI researchers + product-company founders; they reward working, explainable, India-relevant work they
could **fold into Redrob's roadmap** (top entries get roadmap integration + a direct hiring pathway).

**Deadline: 2 July 2026** (Ideathon). Today: 23 June 2026 → ~9 days. Solo allowed. Grand Finale 22 July
(virtual, ~5-min live demo + Q&A for shortlist). **Ambition (locked): working prototype + deck + video.**

**Concept (locked): Pramaan — a Proof-of-Work Graph (Artifact Provenance Engine).**
Chosen over 13 other vetted concepts by a 6-generator / 2-adversarial-judge ideation panel. Both judges
converged on the same discriminator: it is the **only top concept whose demo runs on REAL, externally
verifiable data (GitHub commit/authorship/timeline metadata)** instead of fabricated labels — so it does
not collapse in the engineer Q&A, and it hits Redrob's *stated* bleeding wound (keyword-stuffers + the
~80 "impossible" honeypots they built for their own Data & AI track).

### The thesis (slide-1 hook)
Redrob's Resume Ranker scores what a candidate **wrote about themselves** — which is why their dataset
rots with keyword-stuffers and honeypots. Pramaan stops scoring the profile text and scores the
**evidence the profile points at**. A "React, 4 yrs" claim is real only if there's an authored commit, a
live deployed URL, a real artifact behind it, in the claimed window. **Fraud isn't a text problem — it's
a provenance problem. Provenance is cheap to verify, expensive to fake. That asymmetry is the moat.**
Output is **evidence cards with citations, not a ranking** (so it does NOT overlap the banned "better
ranker" idea or the Data & AI track) — a trust layer the Resume Ranker consumes as a feature.

## Recommended approach

Build a deployable web demo + the agent that powers it, then wrap it in the 16-slide deck (5 mandatory
diagrams) + a 60–90s video. One coherent narrative arc across three framings the sub-track asks for:
**deep-technical (the engine) → Bharat (vernacular expansion) → network-effect (the Verified Skill Passport).**

### The agent loop (this IS the "AI Logic & Decision Flow" mandatory diagram)
Per claimed skill on a profile:
1. **RESOLVE** — find the candidate's real artifacts: GitHub/GitLab handle, deployed/portfolio URLs,
   blog/Substack, npm/PyPI author pages.
2. **FETCH** — pull commit metadata + diffs (GitHub API), hit deployed URLs for liveness + content match,
   fetch published writing (Firecrawl).
3. **RECONCILE** — does *authored* code (not forked, not vendored) substantively contain the claimed skill,
   inside the claimed time window? LLM reasons over the retrieved evidence — never the profile string.
4. **ATTRIBUTE** (the honeypot kill-shot) — forked-vs-authored (first-commit + authorship), AI-generated /
   copy-paste signal (commit-cadence + perplexity heuristic, **flag-for-review only, never auto-reject**),
   and **timeline reconciliation** ("claims 4 yrs React from 2019, but first authored React commit is 2023").
5. **EMIT** — an **Evidence Card** per skill: `{skill, verdict: verified|unverified|contradicted,
   confidence, cited_artifacts[], plain_language_reason}`. Aggregate → a trust-weighted feature object
   the Resume Ranker can ingest (clean API contract).

**Defensibility rule (what survives the engineer Q&A):** the LLM must **cite the artifact or return
`unverified`** — no uncited claims, no hallucinated skills. This is the whole credibility play.

### Tech stack (decisions — lean + cheap, mirrors Redrob's low-cost story)
- **Frontend / demo:** Next.js (App Router) + Tailwind + shadcn/ui, deployed on **Vercel** (the public
  URL is our "demo link"). UI = paste GitHub handle + claimed skills → 3 Evidence Cards side-by-side.
- **Agent backend:** **Vercel AI SDK** (provider-agnostic, runs in the Next app, deploys clean on Vercel)
  running the plan→fetch→reconcile→cite loop with tool calls. LLM provider = **OpenRouter** (one key →
  any model). *Routing decision:* cheap bulk calls → a mini model (e.g. gpt-4o-mini / Llama / DeepSeek);
  the hard "does this evidence match the claim" reconcile → a strong model (e.g. gpt-4o / Claude Sonnet).
  Frame cost in the deck as "90% of calls are deterministic fetch/parse; only the final reconcile needs an
  LLM → per-profile cost ≈ near-zero, maps to Redrob's own cheap 2B model in prod." (Anthropic/OpenAI keys
  also work — OpenRouter chosen for routing flexibility + the cheap-inference narrative.)
- **Evidence sources (zero new paid keys):** GitHub REST/GraphQL API (commits, authorship, languages,
  contribution timeline — the core, free with a PAT); **Jina AI Reader** (`r.jina.ai`, free/no-key) to read
  blog/portfolio writing, open-source fallback **Crawl4AI**; plain `fetch()` + **Playwright** (open-source)
  for deployed-URL liveness + JS-heavy pages; **Exa** (already wired as an MCP) for artifact discovery in
  the RESOLVE step. Firecrawl/Skyvern/Tavily not needed.
- **Repo:** public GitHub repo, README with one-command run, MIT. **Deck:** Slidev (Markdown + Mermaid
  diagrams → PDF export) for a sharp, versionable technical deck; the live-app UI mockups via Pencil MCP.

### Demo personas (crafted, shown side-by-side on stage)
1. **VERIFIED** — a genuine senior dev (real public GitHub): cards cite real authored commits + a live deploy.
2. **CONTRADICTED** — a synthetic *honeypot*: we take a real account but feed claimed dates that contradict
   its real commit history → timeline-reconciliation flags it. (Directly mirrors Redrob's 80 honeypots.)
3. **UNVERIFIED** — a keyword-stuffer: lots of claimed skills, no artifacts found → all `unverified`.

## Tasks / subtasks (9-day timeline)

- **A. Core agent on GitHub data (Day 1–2)** — scaffold Next+SDK repo; RESOLVE→FETCH→RECONCILE→cite for
  code skills; prove one VERIFIED + one CONTRADICTED case in CLI. Files: `agent/loop.ts`, `agent/tools/github.ts`.
- **B. Attribution + honeypot kill-shot (Day 3–4)** — forked-vs-authored, timeline reconciliation,
  AI-code flag, URL liveness, writing evidence via Firecrawl; Evidence Card schema + aggregate trust score.
  Files: `agent/tools/{liveness,writing}.ts`, `agent/attribute.ts`, `lib/evidence.ts`.
- **C. Demo UI + deploy (Day 4–5)** — paste-handle UI → 3 cards; deploy to Vercel; craft + freeze the 3
  personas. Files: `app/page.tsx`, `app/api/verify/route.ts`.
- **D. Deck + 5 mandatory diagrams (Day 5–6)** — Slidev deck → PDF: title/hook, Redrob context, problem,
  vision, solution, **User Journey**, **AI Decision Flow**, **System Architecture**, **Data/Intelligence
  Layer**, scalability/cost, **Ecosystem Integration** (trust-feature API + Verified-badge network effect),
  impact metrics, **Bharat expansion + Skill Passport** moat slide, roadmap, demo links. ≤5 appendix slides
  (honeypot confusion-matrix eval). Files: `deck/slides.md`.
- **E. Video + repo polish + metadata (Day 7)** — 60–90s screen-record walkthrough; README + reproduce
  command; `submission_metadata.yaml`; honest AI-tools declaration.
- **F. Finale prep + buffer (Day 8)** — dry-run the ~5-min demo; write a Q&A defense doc (anticipated
  engineer questions + answers); fix gaps.
- **G. Submit (Day 9, well before 2 Jul)** — deck PDF + GitHub + demo URL + video on the portal.

## What I need from you (only 2 secrets; everything else already set or free)
- **OpenRouter API key** — for the reconcile model via Vercel AI SDK (est. **< $5** total dev+demo; will flag before any batch run, per cost rule).
- **GitHub PAT, read-only / public repositories only** — for the *deployed app's* runtime GitHub reads. Minimal scope on purpose; do not reuse the broad `gh` token in a public-facing app.
- **Already set:** Vercel (logged in as `shai-2002`); GitHub push uses existing `gh` auth (`Shai-2002`, has `repo`); Exa via MCP; Jina Reader + Playwright are keyless/open-source.
- *Optional polish:* a domain like `pramaan.xyz` (~₹800/yr) and a Supabase free instance if we cache evidence.
- **Secret handoff:** keys go into a gitignored `.env.local` (never printed, never committed). Prefer creating `~/pramaan-secrets.env` yourself or `vercel env add` so keys stay out of the chat transcript.

## Verification (evidence, not assertions)
- **Live end-to-end run** on the 3 frozen personas → 3 correct verdicts (VERIFIED / CONTRADICTED / UNVERIFIED),
  each card citing a real artifact or returning `unverified`. Capture the screen recording as proof.
- **Honeypot check:** the synthetic-honeypot persona is flagged CONTRADICTED by timeline reconciliation —
  screenshot the cited contradiction.
- **Deck:** exports to a 16-slide PDF with all 5 mandatory diagrams present (checklist).
- **Repo:** `npm run verify <github-handle>` reproduces an Evidence Card set from a clean clone.
- **Deploy:** public Vercel URL loads and runs the demo from a fresh browser.

## Guardrails
- This is a bounded, finishable hackathon entry — **not** a new venture. Build deep on Pramaan, not wide.
- Stay in the high-evidence domain (code + writing) for the live demo; position vernacular/multimodal
  (Pramaan-Bharat) as the *roadmap* slide, not a 9-day build risk.
- AI-code detection is probabilistic → always "flag for review," never auto-reject (defensible in Q&A).
- Declare AI tool use honestly; a human must own and defend every design choice.
