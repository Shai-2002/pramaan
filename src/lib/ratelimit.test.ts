import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  llmBudgetAvailable,
  recordLlmCall,
  verifyBudgetAvailable,
  recordVerify,
  __resetRateLimit,
} from "@/lib/ratelimit";

const DAY = 24 * 3_600_000;

beforeEach(() => __resetRateLimit(0));

describe("checkRateLimit — per-IP sliding window", () => {
  it("allows up to 5 requests in a minute, blocks the 6th", () => {
    for (let i = 0; i < 5; i++) expect(checkRateLimit("1.2.3.4", 0).ok).toBe(true);
    const sixth = checkRateLimit("1.2.3.4", 0);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfter).toBe(60);
  });

  it("frees the per-minute window after 60s", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("1.2.3.4", 0);
    expect(checkRateLimit("1.2.3.4", 0).ok).toBe(false);
    expect(checkRateLimit("1.2.3.4", 61_000).ok).toBe(true);
  });

  it("tracks IPs independently", () => {
    for (let i = 0; i < 5; i++) checkRateLimit("a", 0);
    expect(checkRateLimit("a", 0).ok).toBe(false);
    expect(checkRateLimit("b", 0).ok).toBe(true);
  });
});

describe("llmBudgetAvailable — daily circuit breaker", () => {
  it("is available until the daily cap is hit", () => {
    expect(llmBudgetAvailable(0)).toBe(true);
    for (let i = 0; i < 200; i++) recordLlmCall(0);
    expect(llmBudgetAvailable(0)).toBe(false);
  });

  it("resets after the 24h window rolls", () => {
    for (let i = 0; i < 200; i++) recordLlmCall(0);
    expect(llmBudgetAvailable(0)).toBe(false);
    expect(llmBudgetAvailable(DAY)).toBe(true);
  });
});

describe("verifyBudgetAvailable — hourly GitHub-fanout breaker", () => {
  const HOUR = 3_600_000;
  it("is available until the hourly cap (100) is hit, then resets next hour", () => {
    expect(verifyBudgetAvailable(0)).toBe(true);
    for (let i = 0; i < 100; i++) recordVerify(0);
    expect(verifyBudgetAvailable(0)).toBe(false);
    expect(verifyBudgetAvailable(HOUR)).toBe(true);
  });
});
