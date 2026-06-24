# Pramaan — build status & handoff

_For continuing on the Mac mini (Stella SSD). Last updated during the MacBook → mini move._

## What this is
Pramaan = a proof-of-work engine for skills, for the hack2skill × Redrob "India Runs"
**Ideathon, Sub-track 1** (deep technical / AI-native). Prize pool ₹30L. **Deadline: 2 July 2026.**
(The Data & AI candidate-ranking track is a *separate* submission handled in another session.)

One-liner: instead of scoring a profile's text, verify the evidence it points at and emit
per-skill Evidence Cards — VERIFIED / UNVERIFIED / CONTRADICTED — with real citations.

## Done ✅
- **Engine** (`src/agent/`): RESOLVE→FETCH→ATTRIBUTE→RECONCILE→EMIT. Deterministic verdicts
  (date + authorship logic); timeline-reconciliation honeypot kill-shot; LLM (OpenRouter,
  `google/gemini-2.5-flash-lite`) only writes the reason, guarded for verdict-consistency.
  Proven live (leerob → verified; impossible date → contradicted; unknown → unverified).
- **Engine tightened** (2026-06-25): commit-level provenance — `github.ts` pulls the earliest
  *authored-commit* date (2-call Link-header trick, bounded to top-5 repos) and cites it;
  `attribute.ts` adds a soft `timeline-thin` flag (never weakens the hard kill-shot) and a
  STRONG-evidence gate so a merely-live URL can't alone verify an unrelated skill. Web content
  (Jina) is now actually used: a live URL backs a skill only if its content mentions it.
- **Spend + security hardening** (2026-06-25, public-endpoint ready): `src/lib/ratelimit.ts`
  — per-IP limit (5/min, 30/hr) + global daily LLM cap (degrades to deterministic-only at $0)
  + global hourly verify cap (bounds GitHub fan-out so a burst can't drain the token). SSRF
  guard `src/lib/url-safety.ts` blocks fetches to private/loopback/link-local hosts. Input
  bounds (≤8 claims, ≤4 URLs). Generic 500s (no upstream-error leak). All from a 5-lens
  adversarial review of the diff.
- **Tests**: Vitest, **37 passing, zero network** (`npm test`) — verdict matrix, frozen
  personas (B1 regression guard), timeline, trust score, rate limiter, SSRF helpers.
- **Verified**: `next build` exit 0; live smoke green (leerob/honeypot/ghost + 429 + 400 + SSRF).
- **UI** (`src/app/page.tsx`): dark demo, 4 one-click presets, trust score, cited Evidence Cards.
- **Deck** (`deck/pramaan.pdf`): 16 slides, 5 mandatory diagrams (Slidev). **LICENSE** (MIT).
- **Docs**: `personas.md`, `qa-defense.md`, `methodology.md`, `PLAN.md`, `shot-list.md` (75s video script).

## Left 🔲 (all Shai-gated)
1. **Rotate keys** (MANDATORY before deploy) — mint a NEW GitHub fine-grained PAT (read-only,
   public repos) + a NEW OpenRouter key (set a hard credit cap); revoke the old ones.
2. **Deploy** — `vercel link` + enter the rotated keys via `vercel env add` (you type them),
   then `vercel --prod`. Repo is on GitHub already (public + MIT).
3. **Honeypot account** — create the `pramaan-demo-honeypot` GitHub account (2026) + push a
   trivial repo; the 4th UI preset ("React since 2017") then busts it live.
4. **Demo video** — record the 75s walkthrough from `docs/shot-list.md` on the deployed URL.

## Run it
```bash
npm install
# create .env.local from .env.local.example, add GITHUB_TOKEN + OPENROUTER_API_KEY
npm run dev -- -p 3211   # http://localhost:3211
npm test                 # 37 unit tests, no network
npm run build            # production build
```
Re-export the deck PDF: `npx playwright install chromium && npx slidev export deck/slides.md --output deck/pramaan.pdf`
Screenshots: `OUT_DIR=. node scripts/shot.mjs` (needs the dev server on 3211).

## Keys
`.env.local` carries `GITHUB_TOKEN` + `OPENROUTER_API_KEY`. **These keys were pasted in chat —
rotate them (item 1 above) before they go into a public Vercel deploy.** They are NOT in git
(.env* is gitignored; verified `git ls-files` shows no env file tracked).
