// Galaxy verification: open via dock, search filter, star pick, close.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { sessionStorage.setItem("mw:booted", "1"); sessionStorage.setItem("mw:toured", "1"); });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.click("text=GALAXY");
await page.waitForTimeout(1800);
await page.screenshot({ path: "shots/galaxy-open-1440x900.png" });
await page.fill('input[aria-label="Search skills"]', "security");
await page.waitForTimeout(800);
await page.screenshot({ path: "shots/galaxy-search-1440x900.png" });
await page.fill('input[aria-label="Search skills"]', "");
// pick a star near an authored cluster: click center-ish then try a few offsets
await page.mouse.click(720, 450);
await page.waitForTimeout(400);
for (const [x, y] of [[860, 380], [600, 520], [780, 560], [640, 350]]) {
  const visible = await page.locator("text=DISMISS").isVisible().catch(() => false);
  if (visible) break;
  await page.mouse.click(x, y);
  await page.waitForTimeout(400);
}
await page.screenshot({ path: "shots/galaxy-detail-1440x900.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(600);
await page.screenshot({ path: "shots/galaxy-closed-1440x900.png" });
console.log("console errors:", errs.length ? errs : "none");
await browser.close();
