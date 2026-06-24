# Pramaan — प्रमाण

**A proof-of-work engine for skills.** Stop scoring what a candidate *wrote* about
themselves. Score the **evidence** their profile points at.

Built for the hack2skill × **Redrob AI** *"India Runs"* Ideathon (Sub-track 1 — deep
technical / AI-native).

---

## The problem

Hiring platforms — including Redrob's Resume Ranker — score the *text* of a profile.
So they rank the best self-describers, not the best builders. That's why Redrob's own
dataset is full of keyword-stuffers and ~80 "impossible" honeypot profiles.

**Fraud isn't a text problem. It's a provenance problem.** A claim ("React, 4 years")
is only as real as the artifact behind it — an authored commit, a live deployment, a
piece of published work, inside the claimed time window. Provenance is cheap to verify
and expensive to fake. That asymmetry is the whole idea.

## What it does

For each claimed skill, Pramaan returns an **Evidence Card** with one of three verdicts:

| Verdict | Meaning |
|---|---|
| ✅ **VERIFIED** | Authored artifacts back the claim — cited, clickable. |
| ⚠️ **UNVERIFIED** | Claimed, but no discoverable artifact (the keyword-stuffer). |
| ❌ **CONTRADICTED** | The timeline is impossible — e.g. "React since 2017" on an account created in 2026 (the honeypot kill-shot). |

The verdict is **deterministic** (date + authorship logic), so correctness never depends
on an LLM. The LLM only writes the plain-language reason, and a guard rejects any reason
inconsistent with the verdict. The model is allowed to see *proof* — never the candidate's
own self-description.

## The agent loop

`RESOLVE` → `FETCH` → `RECONCILE` → `ATTRIBUTE` → `EMIT`

1. **RESOLVE** — find the candidate's real artifacts (GitHub, deploys, writing).
2. **FETCH** — commit metadata + authorship (GitHub API), URL liveness, published writing (Jina Reader).
3. **RECONCILE** — reason over *retrieved evidence only* to decide if the claim holds in-window.
4. **ATTRIBUTE** — forked-vs-authored, AI-generated-code *flag* (never auto-reject), and timeline reconciliation.
5. **EMIT** — `{ skill, verdict, confidence, citedArtifacts[], reason }`.

See `deck/pramaan.pdf` for the full architecture, data-layer, and ecosystem-integration diagrams.

## Run locally

```bash
npm install
cp .env.local.example .env.local   # then add your keys (see below)
npm run dev                          # http://localhost:3000
```

Environment variables (`.env.local`):

```
GITHUB_TOKEN=          # GitHub PAT, read-only / public repos (raises API rate limit)
OPENROUTER_API_KEY=    # OpenRouter key for the reason model
OPENROUTER_MODEL=google/gemini-2.5-flash-lite   # optional; this is the default
```

The GitHub token is optional for light local use (the public API works unauthenticated
at 60 req/hr). The OpenRouter key is optional too — without it, verdicts are unchanged and
reasons fall back to a deterministic template.

## Reproduce a verdict

```bash
curl -s -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"githubHandle":"leerob","claims":[{"skill":"Next.js","claimedSince":"2020"},{"skill":"TypeScript"}],"deployedUrls":["https://leerob.com"]}'
```

## Demo presets

- **Real senior dev** (`leerob`) → all VERIFIED, cited.
- **Honeypot** → `Next.js since 2010` on an account created later → CONTRADICTED.
- **Keyword-stuffer** → unknown handle, dense skills → UNVERIFIED.

## Tech stack

- **Next.js 16** + React 19 on Vercel
- **Vercel AI SDK** agent loop; LLM via **OpenRouter** (model-agnostic; cheap non-reasoning flash model)
- Evidence: **GitHub API** (`@octokit/rest`), **Jina Reader** (keyless), **Playwright** (liveness), **Exa** (discovery)
- Deck rendered with **Slidev** (`npx slidev export deck/slides.md`)

## AI tools declaration

AI tools (Claude, via Claude Code) were used in development — architecture, code, deck
copy, and diagram drafting. All design decisions are owned and defensible. No candidate
data is sent to any LLM during verification; the reconcile step sees only retrieved,
public artifacts. Declared honestly.

## Status

PoC: GitHub + deploy + writing evidence → live three-verdict Evidence Cards, end-to-end on
real data. Roadmap (see deck): ranker-integration contract, caching + confidence calibration
against the honeypot set, more evidence connectors, and the Bharat track (vernacular voice
intake + a portable Verified Skill Passport).
