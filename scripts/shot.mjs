import { chromium } from "playwright";

const base = process.env.BASE_URL ?? "http://localhost:3211";
const out = process.env.OUT_DIR ?? ".";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 1800 },
  deviceScaleFactor: 2,
});

await page.goto(base, { waitUntil: "networkidle", timeout: 30000 });
await page.screenshot({ path: `${out}/landing.png`, fullPage: true });
console.log("landing.png done");

await Promise.all([
  page.waitForResponse((r) => r.url().includes("/api/verify"), { timeout: 30000 }),
  page.getByRole("button", { name: /Real senior dev/ }).click(),
]);
await page.getByText("VERIFIED").first().waitFor({ timeout: 30000 });
await page.getByRole("button", { name: /^Verify$/ }).waitFor({ timeout: 10000 }); // loading cleared
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/result.png`, fullPage: true });
console.log("result.png done");

await browser.close();
