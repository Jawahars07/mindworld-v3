// Captures the cold-boot sequence: early frame (typing), late frame (complete),
// and the reveal after it fades. Usage: node scripts/shoot-boot.mjs [url] [w] [h]
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3033";
const width = parseInt(process.argv[3] || "1440", 10);
const height = parseInt(process.argv[4] || "900", 10);

const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});
const page = await browser.newPage({ viewport: { width, height } });
page.on("console", (m) => {
  if (m.type() === "error") console.log("[console.error]", m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

await page.goto(url, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1200);
await page.screenshot({ path: `shots/boot-typing-${width}x${height}.png` });
console.log("saved boot-typing");
await page.waitForTimeout(4500);
await page.screenshot({ path: `shots/boot-late-${width}x${height}.png` });
console.log("saved boot-late");
await page.waitForTimeout(4000);
await page.screenshot({ path: `shots/boot-reveal-${width}x${height}.png` });
console.log("saved boot-reveal");
await browser.close();
