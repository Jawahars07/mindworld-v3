import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
page.on("response", (r) => { if (r.status() >= 400) console.log("FAILED:", r.status(), r.url()); });
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
await browser.close().catch(() => {});
process.exit(0);
