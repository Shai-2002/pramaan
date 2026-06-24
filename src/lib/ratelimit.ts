// In-memory guardrails for the public /api/verify endpoint. No external deps.
//
// HONEST SCOPE: this state is per-serverless-instance — it resets on cold start and
// is NOT shared across instances. It stops casual abuse and runaway client loops, not
// a determined distributed attacker. The real spend backstop is a hard credit cap set
// on the OpenRouter key in the dashboard. We say this plainly rather than pretending
// the limiter is bulletproof.
//
// A `now` parameter is injected on every function purely so the unit tests can drive
// the clock deterministically; production callers omit it and get Date.now().

export type RateLimitResult = { ok: boolean; retryAfter?: number };

const PER_MINUTE = 5; // requests / 60s / IP
const PER_HOUR = 30; // requests / hour / IP
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

const hits = new Map<string, number[]>();

/** Sliding-window per-IP rate limit. Returns { ok:false, retryAfter } when exceeded. */
export function checkRateLimit(ip: string, now: number = Date.now()): RateLimitResult {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < HOUR);
  const lastMinute = recent.filter((t) => now - t < MINUTE).length;

  if (lastMinute >= PER_MINUTE) {
    hits.set(ip, recent);
    return { ok: false, retryAfter: 60 };
  }
  if (recent.length >= PER_HOUR) {
    hits.set(ip, recent);
    const oldest = recent[0];
    return { ok: false, retryAfter: Math.max(1, Math.ceil((HOUR - (now - oldest)) / 1000)) };
  }

  recent.push(now);
  hits.set(ip, recent);
  return { ok: true };
}

// Global daily LLM-call circuit breaker. When tripped, the verify route still returns
// the DETERMINISTIC verdict (the LLM only writes prose), so the product keeps working
// at $0 marginal spend — it just falls back to the deterministic reason line.
const DAILY_LLM_CAP = 200;
let llmWindowStart = Date.now();
let llmCalls = 0;

function rollWindow(now: number) {
  if (now - llmWindowStart >= DAY) {
    llmWindowStart = now;
    llmCalls = 0;
  }
}

/** True while the daily LLM budget has headroom. */
export function llmBudgetAvailable(now: number = Date.now()): boolean {
  rollWindow(now);
  return llmCalls < DAILY_LLM_CAP;
}

/** Record one LLM call against the daily budget. Call right before generateText. */
export function recordLlmCall(now: number = Date.now()): void {
  rollWindow(now);
  llmCalls += 1;
}

// Global hourly cap on whole verify operations. Each /api/verify fans out to ~40 GitHub
// API calls, and GitHub's authenticated budget is 5000/hr — so an uncapped public endpoint
// could drain the owner's token and 403 the live demo. The LLM cap above does NOT protect
// the GitHub path, so this is its own backstop. 100 verifies/hr ≈ 4000 GitHub calls/hr.
const HOURLY_VERIFY_CAP = 100;
let verifyWindowStart = Date.now();
let verifyCount = 0;

function rollVerifyWindow(now: number) {
  if (now - verifyWindowStart >= HOUR) {
    verifyWindowStart = now;
    verifyCount = 0;
  }
}

/** True while the hourly verify (GitHub fan-out) budget has headroom. */
export function verifyBudgetAvailable(now: number = Date.now()): boolean {
  rollVerifyWindow(now);
  return verifyCount < HOURLY_VERIFY_CAP;
}

/** Record one verify operation against the hourly budget. */
export function recordVerify(now: number = Date.now()): void {
  rollVerifyWindow(now);
  verifyCount += 1;
}

/** Test-only: clear all in-memory state. */
export function __resetRateLimit(now: number = Date.now()): void {
  hits.clear();
  llmWindowStart = now;
  llmCalls = 0;
  verifyWindowStart = now;
  verifyCount = 0;
}
