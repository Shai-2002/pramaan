import { NextResponse } from "next/server";
import { ProfileInputSchema } from "@/lib/types";
import { verifyProfile } from "@/agent/loop";

// Node runtime: uses @octokit/rest and (later) Playwright.
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const startedAt = Date.now();
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

  try {
    const result = await verifyProfile(parsed.data, startedAt);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
