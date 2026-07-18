import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:toured", "1"));
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
const before = await page.evaluate(() => !!document.querySelector('[aria-label*="booting"]'));
await page.keyboard.press("KeyX");
await page.waitForTimeout(1200);
const after = await page.evaluate(() => !!document.querySelector('[aria-label*="booting"]'));
console.log("boot overlay before press:", before, "| after press:", after);
// wait for natural finish
await page.waitForTimeout(8000);
const late = await page.evaluate(() => ({
  bootGone: !document.querySelector('[aria-label*="booting"]'),
  charStyle: document.querySelector(".hero-char")?.getAttribute("style") ?? "none",
}));
console.log("late:", JSON.stringify(late));
await browser.close().catch(() => {});
process.exit(0);
