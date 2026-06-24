// SSRF guard for visitor-supplied URLs. The /api/verify endpoint fetches deployedUrls /
// writingUrls server-side; without this a public caller could point them at internal
// hosts (localhost, RFC1918, link-local/metadata) and use the reflected HTTP status as a
// probe oracle. We reject non-http(s) schemes and any host that resolves to a private IP.
//
// Residual: redirect:"follow" on the eventual fetch could still 3xx into internal space
// (DNS-rebinding / redirect). Accepted for this demo's scope and documented at the call site.

import { lookup } from "node:dns/promises";

export function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = p;
  if (a === 0 || a === 10 || a === 127) return true; // this-network, private, loopback
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata 169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

export function isPrivateIPv6(ip: string): boolean {
  const x = ip.toLowerCase().replace(/^\[|\]$/g, "");
  if (x === "::1" || x === "::") return true; // loopback / unspecified
  if (x.startsWith("fe80")) return true; // link-local
  if (x.startsWith("fc") || x.startsWith("fd")) return true; // unique-local (fc00::/7)
  if (x.startsWith("::ffff:")) return isPrivateIPv4(x.slice(7)); // IPv4-mapped
  return false;
}

/** True only if `raw` is an http(s) URL whose host does not resolve to a private/internal IP. */
export async function isSafeFetchTarget(raw: string): Promise<boolean> {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;

  const host = u.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return false;
  }

  try {
    const addrs = await lookup(host, { all: true }); // resolves IP literals to themselves too
    if (addrs.length === 0) return false;
    for (const a of addrs) {
      if (a.family === 4 && isPrivateIPv4(a.address)) return false;
      if (a.family === 6 && isPrivateIPv6(a.address)) return false;
    }
  } catch {
    return false; // unresolvable host → don't fetch
  }
  return true;
}
