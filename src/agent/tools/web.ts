// Web evidence tool — URL liveness + clean content for deployed/writing claims.
// STUB: real version uses fetch() for status and Jina Reader (https://r.jina.ai/<url>,
// free/no-key) for content; Playwright fallback for JS-heavy pages. Implemented by the fleet.

import type { WebEvidence } from "@/lib/types";

export async function getWebEvidence(url: string): Promise<WebEvidence> {
  // TODO(fleet): HEAD/GET for liveness; r.jina.ai for readable content (truncate ~4k chars).
  return { url, live: false };
}
