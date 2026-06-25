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

## Live 🚀 (2026-06-25)
- **Deployed:** https://pramaan-one.vercel.app — public, READY, verified live (leerob→verified
  with cited repos + commit dates; correct `<title>`). Vercel project
  `shais-projects-be083a1f/pramaan`, auto-connected to the GitHub repo (pushes auto-deploy).
- **Demo video:** `deck/video/pramaan-demo-final-tts.mp4` (61.5s, narrated — scratch *Samantha*
  TTS voiceover, beats aligned). Silent master: `deck/video/pramaan-demo-silent.mp4`; script:
  `docs/voiceover.md`. Swap in Shai's own voice anytime:
  `node scripts/mux.mjs <yourAudio> deck/video/pramaan-demo-final.mp4`.

## Left 🔲
1. **Rotate keys (post-event) + set an OpenRouter credit cap NOW.** The CURRENT GITHUB_TOKEN +
   OPENROUTER_API_KEY (pasted in chat) are live in the Vercel prod env. The endpoint is public:
   in-code guardrails cap throughput (per-IP + daily LLM cap → $0 degrade + hourly GitHub cap),
   but the real spend backstop is a hard credit cap on the OpenRouter key — set it in the
   dashboard today. Rotate both keys after the event.
2. **Optional polish:** record Shai's own voiceover (replaces the TTS via the mux command above);
   create `pramaan-demo-honeypot` GitHub account for the live-account demo beat (the leerob/2010
   kill-shot already carries it).

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
`.env.local` carries `GITHUB_TOKEN` + `OPENROUTER_API_KEY`; the same values are set in the
Vercel **production** env (encrypted, not public). They are NOT in git (.env* is gitignored;
`git ls-files` shows no env file tracked). **These keys were pasted in chat and are now live on
a public endpoint — set an OpenRouter credit cap today and rotate both after the event** (Left §1).
