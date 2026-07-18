import { chromium } from "playwright";
const url = process.argv[2] || "http://localhost:3033";
const w = parseInt(process.argv[3] || "1440"), h = parseInt(process.argv[4] || "900");
const pts = (process.argv[5] || "0.21,0.6,0.76").split(",").map(Number);
const browser = await chromium.launch({ channel: "chrome", headless: true,
  args: ["--use-angle=metal"] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
// measure the film, not the boot/tour overlays
await page.addInitScript(() => {
  sessionStorage.setItem("mw:booted", "1");
  sessionStorage.setItem("mw:toured", "1");
});
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
for (const p of pts) {
  await page.evaluate((pp) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * pp);
  }, p);
  await page.waitForTimeout(2000);
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else res((n / (performance.now() - t0)) * 1000); };
    requestAnimationFrame(tick);
  }));
  console.log(`p=${p} ${w}x${h}: ${fps.toFixed(1)} fps`);
}
await browser.close();
