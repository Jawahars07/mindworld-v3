// Hero reveal verification: boot completes → GSAP staged reveal settles.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:toured", "1"));
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
await page.mouse.click(720, 700); // any pointerdown skips; the SKIP button itself shifts while lines type
await page.waitForTimeout(1200);
await page.screenshot({ path: "shots/hero-mid-1440x900.png" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "shots/hero-final-1440x900.png" });
console.log("console errors:", errs.filter(e => !e.includes("404")).length ? errs : "none (excl. insights 404)");
await browser.close().catch(() => {});
process.exit(0);
