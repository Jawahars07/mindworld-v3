// Recruiter-mode verification: start the tour, sample frames along the beats.
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
await page.click("text=▶ 90S TOUR");
const samples = [
  [3000, "tour-1-who"], [11000, "tour-2-blr"], [16000, "tour-3-adopt"],
  [12000, "tour-4-galaxy"], [12000, "tour-5-ask"], [10000, "tour-6-close"],
];
let t = 0;
for (const [wait, name] of samples) {
  await page.waitForTimeout(wait); t += wait;
  await page.screenshot({ path: `shots/${name}-1440x900.png` });
  console.log("saved", name, `t=${t / 1000}s`);
}
console.log("console errors:", errs.length ? errs : "none");
await browser.close();
