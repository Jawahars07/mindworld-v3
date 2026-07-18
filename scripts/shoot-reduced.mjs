// prefers-reduced-motion pass: boot shows all lines instantly; galaxy is static.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3033", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(800);
await page.screenshot({ path: "shots/reduced-boot-1440x900.png" });
await page.waitForTimeout(2500);
await page.click("text=GALAXY").catch(() => {});
await page.waitForTimeout(1500);
await page.screenshot({ path: "shots/reduced-galaxy-1440x900.png" });
console.log("console errors:", errs.filter(e => !e.includes("404")).length ? errs : "none (excl. vercel-insights 404)");
await browser.close().catch(() => {});
process.exit(0);
