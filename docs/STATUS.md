# Pramaan — build status & handoff

_For continuing on the Mac mini (Stella SSD). Last updated during the MacBook → mini move._

## What this is
Pramaan = a proof-of-work engine for skills, for the hack2skill × Redrob "India Runs"
**Ideathon, Sub-track 1** (deep technical / AI-native). Prize pool ₹30L. **Deadline: 2 July 2026.**
(The Data & AI candidate-ranking track is a *separate* submission handled in another session.)

One-liner: instead of scoring a profile's text, verify the evidence it points at and emit
per-skill Evidence Cards — VERIFIED / UNVERIFIED / CONTRADICTED — with real citations.

## Done ✅
- **Engine** (`src/agent/`): RESOLVE→FETCH→RECONCILE→ATTRIBUTE→EMIT. Deterministic verdicts
  (date + authorship logic); timeline-reconciliation honeypot kill-shot; LLM (OpenRouter,
  `google/gemini-2.5-flash-lite`) only writes the reason, guarded for verdict-consistency.
  Proven live on real GitHub data (leerob → verified; impossible date → contradicted; unknown → unverified).
- **UI** (`src/app/page.tsx`): dark demo with 3 one-click presets, trust score, cited Evidence Cards.
- **Deck** (`deck/pramaan.pdf`): 16 slides, 5 mandatory diagrams render legibly (Slidev).
- **Docs**: `docs/personas.md`, `docs/qa-defense.md` (15 Q&A), `docs/methodology.md`, `docs/PLAN.md`.

## Left 🔲
1. **Deploy** — public Vercel URL + GitHub repo (awaiting Shai's go-ahead). Set `GITHUB_TOKEN`
   + `OPENROUTER_API_KEY` as Vercel env vars (do NOT commit them).
2. **Demo video** — 60–90s walkthrough (a Playwright screen-capture script is in `scripts/`).
3. **Honeypot demo persona** — optionally create a throwaway `pramaan-demo-honeypot` GitHub
   account (created 2026) so "8 yrs since 2017" busts live; else use the impossible-date framing.

## Run it
```bash
npm install
# create .env.local from .env.local.example, add GITHUB_TOKEN + OPENROUTER_API_KEY
npm run dev            # http://localhost:3000
```
Re-export the deck PDF: `npx playwright install chromium && npx slidev export deck/slides.md --output deck/pramaan.pdf`
Screenshots: `OUT_DIR=. node scripts/shot.mjs` (needs the dev server running).

## Keys
`.env.local` carries `GITHUB_TOKEN` + `OPENROUTER_API_KEY`. **These keys were pasted in chat —
rotate them after the event.** Keep them out of git (.env* is gitignored).
