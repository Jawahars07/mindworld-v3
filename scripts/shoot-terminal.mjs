// Terminal verification: open via backtick, run whoami + ls projects + ls skills.
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => { sessionStorage.setItem("mw:booted", "1"); sessionStorage.setItem("mw:toured", "1"); });
const errs = [];
page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
page.on("pageerror", (e) => errs.push(e.message));
await page.goto("http://localhost:3033", { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.keyboard.press("`");
await page.waitForTimeout(700);
const type = async (cmd) => {
  await page.fill('input[aria-label="Terminal command input"]', cmd);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(350);
};
await type("whoami");
await type("ls projects");
await type("ls skills");
await page.screenshot({ path: "shots/terminal-1440x900.png" });
console.log("console errors:", errs.length ? errs : "none");
await browser.close().catch(() => {});
process.exit(0);
