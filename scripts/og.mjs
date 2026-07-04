// Build the OG card: clean 1200x630 flagship frame (HUD hidden) + typographic overlay.
import { chromium } from "playwright";

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

// 1) base render
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.evaluate(() => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo(0, max * 0.56);
});
await page.waitForTimeout(2400);
await page.addStyleTag({ content: ".z-20,.z-30{display:none!important}" });
await page.waitForTimeout(300);
await page.screenshot({ path: "shots/og-base.png" });

// 2) typographic overlay composed in-browser
const comp = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await comp.goto("file:///Users/jawah/Desktop/NewWorld/mindworld-v3/scripts/og.html", {
  waitUntil: "networkidle",
});
await comp.waitForTimeout(800);
await comp.screenshot({ path: "public/og.png" });
console.log("saved public/og.png");
await browser.close();
