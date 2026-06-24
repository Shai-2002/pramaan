import { defineConfig } from "vitest/config";

// Tests target PURE deterministic logic (verdict, timeline, trust score, rate limit) —
// no network, no Next runtime. resolve.tsconfigPaths maps the "@/*" alias natively.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
