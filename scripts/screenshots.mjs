// Visual check: signs in via an admin-generated magic link (local only) and
// screenshots pages with the local Chrome.
// Usage: node --env-file=.env.local scripts/screenshots.mjs <outDir> [path ...]
import { chromium } from "playwright-core";
import { generateOwnerTokenHash } from "./lib/dev-session.mjs";

const [outDir, ...paths] = process.argv.slice(2);
const base = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";
const width = Number(process.env.SHOT_WIDTH ?? 1440);
const height = Number(process.env.SHOT_HEIGHT ?? 900);
const theme = process.env.SHOT_THEME ?? "dark";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
await context.addInitScript((t) => localStorage.setItem("theme", t), theme);
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => (m.type() === "error" || m.type() === "warning") && errors.push(`${m.type()}: ${m.text().slice(0, 4000)}`));

await page.goto(`${base}/auth/callback?token_hash=${await generateOwnerTokenHash()}&type=magiclink`);
  await page.waitForURL(`${base}/`);

for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(Number(process.env.SHOT_WAIT ?? 1500));
  const file = `${outDir}/${theme}-${width}${p.replace(/[^a-z0-9]+/gi, "_") || "_root"}.png`;
  await page.screenshot({ path: file, fullPage: process.env.SHOT_FULL === "1" });
  console.log(file);
}
if (errors.length) console.log("ERRORS:\n" + [...new Set(errors)].join("\n"));
await browser.close();
