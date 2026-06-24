// Web evidence tool — URL liveness + clean content. Keyless:
//   - liveness via a plain fetch (timeout-guarded)
//   - readable content via Jina AI Reader (https://r.jina.ai/<url>), free/no-key

import type { WebEvidence } from "@/lib/types";
import { isSafeFetchTarget } from "@/lib/url-safety";

async function withTimeout(url: string, ms: number, init?: RequestInit) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

export async function getWebEvidence(url: string): Promise<WebEvidence> {
  // SSRF guard: never fetch a URL that resolves to an internal/private host.
  if (!(await isSafeFetchTarget(url))) return { url, live: false };

  let status: number | undefined;
  let live = false;
  try {
    const res = await withTimeout(url, 7000, { method: "GET", headers: { "user-agent": "PramaanBot/0.1" } });
    status = res.status;
    live = res.ok;
  } catch {
    return { url, live: false };
  }

  let content: string | undefined;
  if (live) {
    try {
      const r = await withTimeout(`https://r.jina.ai/${url}`, 9000);
      if (r.ok) content = (await r.text()).slice(0, 4000);
    } catch {
      /* content is optional; liveness already established */
    }
  }
  return { url, live, status, content };
}
