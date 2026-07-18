// Room verification: scroll to Adopt sheet, enter flagship room, then a workshop room.
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
const go = (p) => page.evaluate((pp) => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, max * pp);
}, p);
await go(0.6); await page.waitForTimeout(2400);
await page.click("text=ENTER THE FLAGSHIP");
await page.waitForTimeout(900);
await page.screenshot({ path: "shots/room-adopt-1440x900.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
await go(0.76); await page.waitForTimeout(2400);
await page.click("text=ENTER TARA");
await page.waitForTimeout(900);
await page.screenshot({ path: "shots/room-tara-1440x900.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(500);
console.log("console errors:", errs.length ? errs : "none");
await browser.close().catch(() => {});
process.exit(0);
