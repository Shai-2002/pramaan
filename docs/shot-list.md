# Pramaan — 75s demo video shot-list

A one-take screen recording (QuickTime → File ▸ New Screen Recording, or ⇧⌘5). Record the
**deployed URL** so judges see a real live site, not localhost. Narrate in your own voice —
the human voiceover + "watch me type a live handle" is the credibility the deck promises.

**Before you hit record**
- Open the deployed URL in a clean browser window (no extensions bar, no bookmarks clutter).
- Zoom the page so the input + one Evidence Card fit on screen (⌘+ once or twice).
- Have `pramaan-demo-honeypot` already created (see STATUS) if you want the live-account beat.
- Do one warm-up run of the "Real senior dev" preset so results are cached/fast on the take.

---

### Beat 1 — The problem (0:00–0:12)
**Do:** land on the page, cursor resting near the headline.
**Say:** *"Hiring platforms score what a candidate writes about themselves. So they rank the best self-describers — not the best builders. Pramaan scores the proof instead."*

### Beat 2 — VERIFIED (0:12–0:32)
**Do:** click **"Real senior dev → verified"**. Let the cards render. Hover one citation link.
**Say:** *"Real GitHub handle, real claims. Pramaan finds the authored commits, repos and live deploys behind each skill — and every card cites the receipt, down to the first-commit date. Click any of these and you land on the actual artifact."*

### Beat 3 — CONTRADICTED, the kill-shot (0:32–0:52)
**Do:** click **"Honeypot → contradicted"** (leerob, Next.js since 2010). Point at the red card.
**Say:** *"Now the lie. This profile claims Next.js since 2010 — but the account didn't exist until 2014. That's not unproven, it's chronologically impossible. The verdict is deterministic, straight from server-stamped dates. This is exactly how it busts the seeded honeypots."*
**Optional (if `pramaan-demo-honeypot` exists):** click **"Honeypot account"** — *"Same mechanism on a throwaway account I made last week claiming eight years."*

### Beat 4 — UNVERIFIED + the close (0:52–1:15)
**Do:** click **"Keyword-stuffer → unverified"**. Then type a judge-style **live handle** into the box and hit Verify to prove it's not staged.
**Say:** *"Buzzwords with no discoverable artifacts come back unverified — not rejected, routed to a human. And it's not hardcoded: type any handle and it runs live. Verdicts are deterministic; the cited reason is the only part the model writes, and it can never change a verdict. Pramaan — stop grading self-description, verify the proof."*

---

**Hard rules for the take**
- Keep it under 90s; aim for ~75.
- Show at least one citation link being real (hover or click-through).
- End on a verified or contradicted card on screen, not a loading state.
- If the network flakes mid-take, the cached "Real senior dev" run is the safe fallback.
