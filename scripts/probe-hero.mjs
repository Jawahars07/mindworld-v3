import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:toured", "1"));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.keyboard.press("KeyX");
await page.waitForTimeout(4000);
const state = await page.evaluate(() => {
  const char = document.querySelector(".hero-char");
  const eyebrow = document.querySelector(".hero-eyebrow");
  const chip = document.querySelector(".hero-chip");
  const root = char?.closest(".hud-fade");
  const cs = char ? getComputedStyle(char) : null;
  return {
    charCount: document.querySelectorAll(".hero-char").length,
    charInlineStyle: char?.getAttribute("style") ?? "none",
    charComputedOpacity: cs?.opacity,
    charComputedTransform: cs?.transform,
    eyebrowStyle: eyebrow?.getAttribute("style") ?? "none",
    chipStyle: chip?.getAttribute("style") ?? "none",
    rootClass: root?.className,
  };
});
console.log(JSON.stringify(state, null, 2));
await browser.close().catch(() => {});
process.exit(0);
