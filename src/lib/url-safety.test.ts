import { describe, it, expect } from "vitest";
import { isPrivateIPv4, isPrivateIPv6, isSafeFetchTarget } from "@/lib/url-safety";

describe("isPrivateIPv4", () => {
  it("flags private / loopback / link-local / CGNAT ranges", () => {
    for (const ip of ["10.0.0.1", "127.0.0.1", "169.254.169.254", "172.16.5.5", "192.168.1.1", "100.70.0.1", "0.0.0.0"]) {
      expect(isPrivateIPv4(ip)).toBe(true);
    }
  });
  it("passes public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "140.82.121.4"]) {
      expect(isPrivateIPv4(ip)).toBe(false);
    }
  });
  it("rejects malformed input", () => {
    expect(isPrivateIPv4("not.an.ip")).toBe(false);
    expect(isPrivateIPv4("10.0.0")).toBe(false);
  });
});

describe("isPrivateIPv6", () => {
  it("flags loopback / link-local / unique-local / mapped-private", () => {
    for (const ip of ["::1", "fe80::1", "fc00::1", "fd12::1", "::ffff:127.0.0.1"]) {
      expect(isPrivateIPv6(ip)).toBe(true);
    }
  });
  it("passes a public v6 and a mapped-public v4", () => {
    expect(isPrivateIPv6("2606:4700:4700::1111")).toBe(false);
    expect(isPrivateIPv6("::ffff:8.8.8.8")).toBe(false);
  });
});

describe("isSafeFetchTarget — offline rejections (return before DNS)", () => {
  it("rejects non-http(s) schemes", async () => {
    expect(await isSafeFetchTarget("ftp://example.com")).toBe(false);
    expect(await isSafeFetchTarget("file:///etc/passwd")).toBe(false);
    expect(await isSafeFetchTarget("javascript:alert(1)")).toBe(false);
  });
  it("rejects internal hostnames", async () => {
    expect(await isSafeFetchTarget("http://localhost:8080/x")).toBe(false);
    expect(await isSafeFetchTarget("http://db.internal/")).toBe(false);
    expect(await isSafeFetchTarget("http://printer.local/")).toBe(false);
  });
  it("rejects unparseable input", async () => {
    expect(await isSafeFetchTarget("not a url")).toBe(false);
  });
});
