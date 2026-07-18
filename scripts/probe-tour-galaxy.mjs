// Confirms the recruiter tour's galaxy beat opens and closes, and logs timing.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.click("text=▶ 90S TOUR");
const t0 = Date.now();
let sawGalaxy = false, opened = 0, closed = 0, done = 0;
for (let i = 0; i < 160; i++) {
  await page.waitForTimeout(500);
  const s = await page.evaluate(() => ({
    galaxy: !!document.querySelector('[aria-label^="Skill galaxy"]'),
    complete: [...document.querySelectorAll("p")].some(p => p.textContent?.includes("TOUR COMPLETE")),
  }));
  if (s.galaxy && !sawGalaxy) { sawGalaxy = true; opened = Date.now() - t0; console.log(`galaxy OPENED at ${(opened/1000).toFixed(1)}s`); }
  if (!s.galaxy && sawGalaxy && !closed) { closed = Date.now() - t0; console.log(`galaxy CLOSED at ${(closed/1000).toFixed(1)}s`); }
  if (s.complete) { done = Date.now() - t0; console.log(`tour COMPLETE at ${(done/1000).toFixed(1)}s`); break; }
}
if (!sawGalaxy) console.log("galaxy beat NEVER OPENED");
await browser.close().catch(() => {});
process.exit(0);
