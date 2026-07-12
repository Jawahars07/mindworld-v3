// Headless visual verification: scroll to given progress points, screenshot each.
// Usage: node scripts/shoot.mjs [url] [w] [h] [p1,p2,...]
import { chromium } from "playwright";

const url = process.argv[2] || "http://localhost:3033";
const width = parseInt(process.argv[3] || "1440", 10);
const height = parseInt(process.argv[4] || "900", 10);
// defaults cover every act boundary + sheet midpoints of the v4 film
const points = (process.argv[5] || "0,0.06,0.11,0.16,0.21,0.27,0.33,0.4,0.46,0.53,0.6,0.66,0.76,0.84,0.9,0.97")
  .split(",")
  .map(Number);

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

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);

for (const p of points) {
  await page.evaluate((pp) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * pp);
  }, p);
  // let the damped camera settle
  await page.waitForTimeout(2200);
  const name = `shots/p${String(Math.round(p * 100)).padStart(3, "0")}-${width}x${height}.png`;
  await page.screenshot({ path: name });
  console.log("saved", name);
}
await browser.close();
