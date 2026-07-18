// OS chrome verification: topbar/dock visible, palette opens, filtered state
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: "shots/os-chrome-1440x900.png" });
await page.keyboard.press("Meta+KeyK");
await page.waitForTimeout(500);
await page.screenshot({ path: "shots/os-palette-1440x900.png" });
await page.keyboard.type("adopt");
await page.waitForTimeout(400);
await page.screenshot({ path: "shots/os-palette-filtered-1440x900.png" });
await page.keyboard.press("Escape");
await page.waitForTimeout(300);
console.log("console errors:", errs.length ? errs : "none");
await browser.close();
