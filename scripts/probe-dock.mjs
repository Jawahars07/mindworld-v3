import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => sessionStorage.setItem("mw:booted", "1"));
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 300)); });
page.on("pageerror", (e) => errs.push("PAGEERROR: " + e.message.slice(0, 300)));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(3000);
const info = await page.evaluate(() => ({
  dockButtons: [...document.querySelectorAll("nav[aria-label='World destinations'] button")].map(b => b.textContent),
  nextErrorOverlay: !!document.querySelector("nextjs-portal"),
  bodyChildren: document.body.children.length,
}));
console.log(JSON.stringify(info, null, 2));
console.log("errors:", errs.length ? errs : "none");
await page.screenshot({ path: "shots/probe-dock.png" });
await browser.close().catch(() => {});
process.exit(0);
