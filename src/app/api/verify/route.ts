import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ProfileInputSchema } from "@/lib/types";
import { verifyProfile } from "@/agent/loop";
import { checkRateLimit, verifyBudgetAvailable, recordVerify } from "@/lib/ratelimit";

// Node runtime: uses @octokit/rest.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const startedAt = Date.now();

  // Spend guard: throttle per-IP before doing any GitHub/LLM work. `headers()` is async
  // in Next 16; NextRequest.ip/.geo were removed, so read the forwarded client IP here.
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const limit = checkRateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded — slow down and retry shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter ?? 60) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = ProfileInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Global fan-out backstop: each verify hits the GitHub API ~40×. Cap total throughput
  // so a burst can't drain the owner's hourly GitHub budget and 403 the live demo.
  if (!verifyBudgetAvailable()) {
    return NextResponse.json(
      { error: "Service at capacity — try again shortly." },
      { status: 503, headers: { "Retry-After": "300" } },
    );
  }
  recordVerify();

  try {
    const result = await verifyProfile(parsed.data, startedAt);
    return NextResponse.json(result);
  } catch (err) {
    // Log detail server-side only; return a generic message (avoid leaking upstream errors).
    console.error("verify failed:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
