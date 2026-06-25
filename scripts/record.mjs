// Records the Pramaan demo to a .webm via Playwright, paced to the voiceover in
// docs/voiceover.md. Visible synthetic cursor + smooth mouse moves so the clicks read.
// Usage:  BASE_URL=http://localhost:3211 node scripts/record.mjs
// Output: deck/video/<hash>.webm  (path printed at the end)

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3211";
const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "deck", "video");
mkdirSync(OUT, { recursive: true });

const W = 1280;
const H = 800;
const pause = (p, ms) => p.waitForTimeout(ms);

// Synthetic cursor so mouse movement is visible in the recording.
const CURSOR = () => {
  const make = () => {
    if (document.getElementById("__cur")) return;
    const d = document.createElement("div");
    d.id = "__cur";
    Object.assign(d.style, {
      position: "fixed", width: "20px", height: "20px", borderRadius: "50%",
      background: "rgba(255,255,255,0.9)", boxShadow: "0 0 0 3px rgba(0,0,0,0.4)",
      zIndex: "2147483647", pointerEvents: "none", transform: "translate(-50%,-50%)",
      left: "0", top: "0", transition: "left .04s linear, top .04s linear",
    });
    (document.body || document.documentElement).appendChild(d);
  };
  window.addEventListener("mousemove", (e) => {
    make();
    const d = document.getElementById("__cur");
    if (d) { d.style.left = e.clientX + "px"; d.style.top = e.clientY + "px"; }
  });
  if (document.readyState !== "loading") make();
  else document.addEventListener("DOMContentLoaded", make);
};

async function moveTo(page, locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 24 });
}

async function clickPreset(page, nameRe) {
  const btn = page.getByRole("button", { name: nameRe });
  await moveTo(page, btn);
  await pause(page, 250);
  const resp = page.waitForResponse((r) => r.url().includes("/api/verify"), { timeout: 30000 });
  await btn.click();
  await resp;
}

const main = async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 2,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  const t0 = Date.now();
  const mark = (l) => console.log(`MARK ${l} ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // Beat 1 — the problem (land, let it breathe)
  mark("B1-land");
  await page.goto(BASE, { waitUntil: "networkidle" });
  await pause(page, 5500);

  // Beat 2 — VERIFIED
  mark("B2-verified-click");
  await clickPreset(page, /^Real senior dev/);
  await page.getByText("VERIFIED").first().waitFor({ timeout: 30000 });
  await pause(page, 2000);
  await page.mouse.wheel(0, 380); // reveal citations
  await pause(page, 7500);
  await page.mouse.wheel(0, -380);
  await pause(page, 1500);

  // Beat 3 — CONTRADICTED (the kill-shot)  [/^Honeypot →/ avoids the "Honeypot account" preset]
  mark("B3-contradicted-click");
  await clickPreset(page, /^Honeypot →/);
  await page.getByText("CONTRADICTED").first().waitFor({ timeout: 30000 });
  await pause(page, 9500);

  // Beat 4 — UNVERIFIED
  mark("B4-unverified-click");
  await clickPreset(page, /^Keyword-stuffer/);
  await page.getByText("UNVERIFIED").first().waitFor({ timeout: 30000 });
  await pause(page, 6500);
  mark("B5-typed-start");

  // Beat 5 — prove it's live: type a real handle by hand
  const handle = page.locator('input').first();
  const skills = page.locator('input').nth(1);
  await moveTo(page, handle);
  await handle.click();
  await handle.fill("");
  await handle.pressSequentially("gaearon", { delay: 110 });
  await skills.click();
  await skills.fill("");
  await skills.pressSequentially("React", { delay: 90 });
  const verify = page.getByRole("button", { name: /^Verify$/ });
  await moveTo(page, verify);
  const resp = page.waitForResponse((r) => r.url().includes("/api/verify"), { timeout: 30000 });
  await verify.click();
  await resp;
  await page.getByText(/VERIFIED|UNVERIFIED|CONTRADICTED/).first().waitFor({ timeout: 30000 });
  await pause(page, 6500);
  mark("END");

  await context.close(); // flushes the .webm
  await browser.close();

  const path = await page.video().path();
  console.log("VIDEO:", path);
};

main().catch((e) => { console.error(e); process.exit(1); });
